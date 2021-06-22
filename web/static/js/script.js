var allData = [], datasetInfo = {}, outliers = [], svg = null, scatterPlotDrawn = false;
var numericDataTypes = new Set([
    "int_", "int8", "int16", "int32", "int64", "uint8", "uint16",
    "uint32", "uint64", "float_", "float16", "float32", "float64"
]);
var showData = (res) => {
    allData = res.data;
    datasetInfo = res.info;
    if ($.fn.DataTable.isDataTable('#table')) {
        $('#table').dataTable().fnClearTable();
        $('#table').dataTable().fnDestroy();
    }
    if (!allData || allData.length == 0) {
        $('#table').append(`<tr><td>No Data Found</td></tr>`);
        $('#columns-selector').selectpicker();
        return;
    }
    let thead = '<tr><td>' + Object.keys(allData[0]).join('</td><td>') + '</td></tr>';
    $('#table').html(`<thead>${thead}</thead>`);
    $('#table').append($('<tbody>'));
    for (let data of allData) {
        let row = '<td>' + Object.values(data).join('</td><td>') + '</td>';
        $('#table > tbody').append(`<tr>${row}</tr>`);
    }
    $('#column-count').text(datasetInfo.columns);
    $('#row-count').text(datasetInfo.rows);
    $('#analysis-panel').show();
    populateDropdown(datasetInfo);
    $('#table').DataTable();
};

var showOutliers = (res) => {
    outliers = res;
    
    if ($.fn.DataTable.isDataTable('#outlier-table')) {
        $('#outlier-table').dataTable().fnClearTable();
        $('#outlier-table').dataTable().fnDestroy();
    }
    if (outliers.data.length == 0) {
        bootbox.alert("No outliers Found! Try tuning the hyperparameters...");
        return;
    }
    $('#outlier-count').text(outliers.count);
    let thead = '<tr><td>' + Object.keys(res.data[0]).join('</td><td>') + '</td></tr>';
    $('#outlier-table').html(`<thead>${thead}</thead>`);
    $('#outlier-table').append($('<tbody>'));
    for (let data of res.data) {
        let row = '<td>' + Object.values(data).join('</td><td>') + '</td>';
        $('#outlier-table > tbody').append(`<tr>${row}</tr>`);
    }    
    $('#myTab li:first-child a').tab('show');
    setTimeout(() => {
        $('#outliers-modal').modal({ backdrop: 'static',  keyboard: false });    
        $('#outlier-table').DataTable();
        $('.throbber').hide();
    }, 500);
    
}

var populateDropdown = (datasetInfo) => {
    $('#columns-selector').selectpicker('destroy');
    $('#columns-selector').html('');
    Object.keys(datasetInfo.dataTypes).forEach(d => {
        let option = $('<option>', { 'value': d, 'text': `${d} - ${datasetInfo.dataTypes[d]}` });
        if (numericDataTypes.has(datasetInfo.dataTypes[d]))
            option.attr('selected', '');
        $('#columns-selector').append(option);
    });
    setTimeout(() => {
        $('#columns-selector').selectpicker();
    }, 500);

};

var getData = () => {
    $('.throbber').show();
    $.ajax({
        method: 'POST',
        url: '/get-data',
        contentType: 'application/json',
        dataType: 'json',
        success: (res) => {
            showData(res);
            $('.throbber').hide();
        }, error: () => {
            $('.throbber').hide();
        }
    });
}

$(document).ready(() => {
    $('#upload-btn').click(() => {
        console.log('btn clicked!');
        let file1 = $('#file1')[0].files[0];
        let file2 = $('#file2')[0].files[0];
        let file3 = $('#file3')[0].files[0];
        let formData = new FormData();
        formData.append("file1", file1);
        formData.append("file2", file2);
        formData.append("file3", file3);
        $('.throbber').show();
        $.ajax({
            method: 'POST',
            url: '/upload-csv',
            data: formData,
            contentType: false,
            processData: false,
            dataType: 'json',
            beforeSend: () => console.log('sending files...'),
            success: (res) => {
                showData(res);
                $('.throbber').hide();
            },
            error: (err) => {
                console.log(err);
                $('.throbber').hide();
            }
        });
    });

    $('#get-outliers').click(() => {
        let columns = $('#columns-selector').val();
        columns = columns.length === 0 ? Object.keys(allData[0]) : columns;
        $('.throbber').show();
        $.ajax({
            method: 'POST',
            url: '/get-outliers',
            data: JSON.stringify({
                'columns': columns,
                'eps': parseFloat($('#eps').val()),
                'minSamples': parseInt($('#min-samples').val())
            }),
            contentType: 'application/json',
            dataType: 'json',
            success: (res) => {
                showOutliers(res);
            },
            error: (err) => {
                bootbox.alert(err.responseText);
                $('.throbber').hide();
            }
        });
    });

    $('#draw-scatter-plot').click(() => {
        if(scatterPlotDrawn)
            return;
        scatterPlotDrawn = true;
        let columns = $('#columns-selector').val();
        columns = columns.length === 0 ? Object.keys(allData[0]) : columns;
        $('.throbber').show();
        $.ajax({
            method: 'POST',
            url: '/get-scatter-plot-data',
            data: JSON.stringify({
                'columns': columns,
                'eps': parseFloat($('#eps').val()),
                'minSamples': parseInt($('#min-samples').val())
            }),
            contentType: 'application/json',
            dataType: 'json',
            success: (res) => {
                console.log(res);
                $("#scatter-plot").html('');
                let outliers = res.outliers.map(d => {
                    d['isOutlier'] = true;
                    return d;
                })
                setTimeout(() => {
                    svg = drawScatterPlotFinal(res.dataset.concat(outliers));
                    $('.throbber').hide();
                }, 200);
            },
            error: (err) => {
                bootbox.alert(err.responseText);
                $('.throbber').hide();
            }
        });
    });

    $('#close-modal-btn').click(() => {
        if ($.fn.DataTable.isDataTable('#outlier-table')) {
            $('#outlier-table').dataTable().fnClearTable();
            $('#outlier-table').dataTable().fnDestroy();
        }
        $('#outlier-table').html(``);
        $("#scatter-plot").html('');
        $('#outliers-modal').modal('hide');
        scatterPlotDrawn = false;
    });

    $('#reset-zoom').click(() => {
        svg.resetZoom();
    });

    getData();
});
