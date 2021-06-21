var allData = [], outliers = [], svg = null;
var showData = (res) => {
    allData = res;
    if ($.fn.DataTable.isDataTable( '#table' )) {
        $('#table').dataTable().fnClearTable();
        $('#table').dataTable().fnDestroy();
    }
    if(res.length == 0) {
        $('#table').append(`<tr><td>No Data Found</td></tr>`);
        $('#columns-selector').selectpicker();
        return;
    }
    let thead = '<tr><td>' + Object.keys(res[0]).join('</td><td>') + '</td></tr>';
    $('#table').html(`<thead>${thead}</thead>`);
    $('#table').append($('<tbody>'));
    for(let data of res) {
        let row = '<td>' + Object.values(data).join('</td><td>') + '</td>';
        $('#table > tbody').append(`<tr>${row}</tr>`);
    }
    populateDropdown(Object.keys(res[0]));
    $('#table').DataTable();
};

var populateDropdown = (values) => {
    // $('#columns-selector').selectpicker('destroy');
    $('#columns-selector').html('');
    values.forEach(d => {
        $('#columns-selector').append($('<option>', {'value': d, 'text': d}));
    });    
    setTimeout(() => {
        $('#columns-selector').selectpicker();
    }, 500);
    
};

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
            }
        });
    });

    $('#get-outliers').click(() => {
        let columns = $('#columns-selector').val();
        columns = columns.length === 0 ? Object.keys(allData[0]) : columns;
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
                outliers = res;
                let thead = '<tr><td>' + Object.keys(res[0]).join('</td><td>') + '</td></tr>';
                $('#outlier-table').html(`<thead>${thead}</thead>`);
                $('#outlier-table').append($('<tbody>'));
                for(let data of res) {
                    let row = '<td>' + Object.values(data).join('</td><td>') + '</td>';
                    $('#outlier-table > tbody').append(`<tr>${row}</tr>`);
                }
                $('#outliers-modal').modal('show');
                $('#outlier-table').DataTable();
                // drawScatterPlot();
            }
        });
    });

    $('#get-data').click(() => {
        $.ajax({
            method: 'POST',
            url: '/get-data',
            contentType: 'application/json',
            dataType: 'json',
            success: (res) => {
                showData(res);
            }
        });
    });

    $('#draw-scatter-plot').click(() => {
        let columns = $('#columns-selector').val();
        columns = columns.length === 0 ? Object.keys(allData[0]) : columns;
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
                }, 500);                
            }
        });
    });
    
    $('#reset-zoom').click(() => {
        svg.resetZoom();
    })

    $('#get-data').trigger('click');
});
