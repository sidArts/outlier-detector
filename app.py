import os
import json

from flask import Flask, render_template, request, jsonify, Response
import pandas as pd

from services.scripts.data_importer import Util

int_datatypes = [
    "int_", "int8", "int16", "int32", "int64", "uint8", "uint16",
    "uint32", "uint64", "float_", "float16", "float32", "float64"
]
app = Flask(__name__, template_folder='./web/templates',
            static_folder='./web/static', static_url_path='/static')


@app.route('/')
def hello_world():
    return render_template('index.html')


@app.route('/upload-csv', methods=['POST'])
def upload_csv():
    dir = './web/uploads'
    for f in os.listdir(dir):
        os.remove(os.path.join(dir, f))
    if request.files.get('file1'):
        f = request.files['file1']
        f.save('./web/uploads/1.' + list(reversed(f.filename.split('.')))[0].strip())
    if request.files.get('file2'):
        f = request.files['file2']
        f.save('./web/uploads/2.' + list(reversed(f.filename.split('.')))[0].strip())
    if request.files.get('file3'):
        f = request.files['file3']
        f.save('./web/uploads/3.' + list(reversed(f.filename.split('.')))[0].strip())
    return get_data()


@app.route('/get-data', methods=['GET', 'POST'])
def get_data():
    try:
        dataset = Util.get_datasets()
        dataset_info: dict = json.loads(dataset.dtypes.to_json())
        dataset_info = {
            'rows': len(dataset),
            'columns': len(list(dataset.columns)),
            'dataTypes': {item[0]: item[1]['name'] for item in dataset_info.items()}
        }
        json_str = '{"data": ' + dataset.head(500).to_json(orient='records') + \
                   ', "info": ' + json.dumps(dataset_info) + '}'
        return Response(json_str, mimetype='application/json')
    except Exception as e:
        return Response('Some error occurred -> ' + str(e), status=500)


@app.route('/get-outliers', methods=['GET', 'POST'])
def get_outliers():
    # columns_to_detect_outlier = request.json if request.json else ['Age_1', 'Annual Income (k$)', 'CustomerID_1']
    try:
        columns_to_detect_outlier = request.json.get('columns')
        # columns_to_convert_numeric = request.json.get('convertToNumericColumns')
        # columns_to_convert_numeric = [col for col in columns_to_convert_numeric if col in columns_to_detect_outlier]

        eps = request.json.get('eps')
        min_samples = request.json.get('minSamples')
        dataset = Util.get_datasets()

        columns_to_convert_numeric = [column for column in columns_to_detect_outlier
                                      if str(dataset[column].dtype).replace("dtype('", '').replace("')", '')
                                      not in int_datatypes]

        # print('Length of dataset -> ' + str(len(dataset)))
        columns_to_drop = [col for col in dataset.columns if col not in columns_to_detect_outlier]
        preprocessed_dataset: pd.DataFrame = dataset.copy().drop(columns_to_drop, axis=1)

        ######
        if columns_to_convert_numeric:
            for col in columns_to_convert_numeric:
                preprocessed_dataset[col] = preprocessed_dataset[col].astype('category')

            cat_columns = preprocessed_dataset.select_dtypes(['category']).columns
            preprocessed_dataset[cat_columns] = preprocessed_dataset[cat_columns].apply(lambda x: x.cat.codes)

        outliers = Util.run_dbscan(preprocessed_dataset, eps, min_samples)
        # print('Length of outliers -> ' + str(len(outliers)))
        json_str = '{"count": ' + str(len(outliers)) + ', "data": ' + \
                   dataset.iloc[outliers].head(500).to_json(orient='records') + '}'
        return Response(json_str, mimetype='application/json')
    except Exception as e:
        return Response(str(e), status=500)


@app.route('/get-scatter-plot-data', methods=['GET', 'POST'])
def get_scatter_plot_data():
    # columns_to_detect_outlier = request.json if request.json else [2, 3, 4]
    try:
        columns_to_detect_outlier = request.json.get('columns')
        # columns_to_convert_numeric = request.json.get('convertToNumericColumns')
        # columns_to_convert_numeric = [col for col in columns_to_convert_numeric if col in columns_to_detect_outlier]
        eps = request.json.get('eps')
        min_samples = request.json.get('minSamples')

        dataset = Util.get_datasets()
        columns_to_drop = [col for col in dataset.columns if col not in columns_to_detect_outlier]
        preprocessed_dataset = dataset.copy().drop(columns_to_drop, axis=1)

        columns_to_convert_numeric = [column for column in columns_to_detect_outlier
                                      if str(preprocessed_dataset[column].dtype).replace("dtype('", '').replace("')", '')
                                      not in int_datatypes]
        ######
        if columns_to_convert_numeric:
            for col in columns_to_convert_numeric:
                preprocessed_dataset[col] = preprocessed_dataset[col].astype('category')

            cat_columns = preprocessed_dataset.select_dtypes(['category']).columns
            preprocessed_dataset[cat_columns] = preprocessed_dataset[cat_columns].apply(lambda x: x.cat.codes)

        outliers_indexes = Util.run_dbscan(preprocessed_dataset, eps, min_samples)

        outliers_df = preprocessed_dataset.iloc[outliers_indexes]
        preprocessed_dataset_without_outlier = preprocessed_dataset.drop(preprocessed_dataset.index[outliers_indexes])

        dataset_pca = Util.run_pca(preprocessed_dataset_without_outlier)
        outlier_pca = Util.run_pca(outliers_df)

        dataset_without_outliers = dataset.drop(dataset.index[outliers_indexes]).reset_index(drop=True)
        dataset_pca_with_details = pd.concat([dataset_pca, dataset_without_outliers], axis=1).head(500)
        outliers_pca_with_details = pd.concat([outlier_pca, dataset.iloc[outliers_indexes].reset_index(drop=True)],
                                              axis=1).head(500)

        json_str = '{"outliers": ' + outliers_pca_with_details.to_json(orient='records') + \
                   ', "dataset": ' + dataset_pca_with_details.to_json(orient='records') + '}'
        return Response(json_str, mimetype='application/json')
    except Exception as e:
        return Response('Some error occurred -> ' + str(e), status=500)


if __name__ == '__main__':
    app.run(port=8000)
