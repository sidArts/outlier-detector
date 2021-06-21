import os
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import MinMaxScaler
from sklearn.cluster import DBSCAN
import numpy as np


class Util:
	@staticmethod
	def read_files(fp1, fp2, fp3):
		data1 = pd.read_csv(fp1)
		data2 = pd.read_csv(fp2)
		data3 = pd.read_csv(fp3)
		result = pd.concat([data1, data2, data3], axis=1)
		result.head()
		return result

	@staticmethod
	def get_datasets():
		directory = './web/uploads'
		dir_contents = os.listdir(directory)
		if not dir_contents:
			return pd.DataFrame()
		datasets = [pd.read_csv(os.path.join(directory, f)) for f in dir_contents]
		# return pd.concat(datasets, axis=1, ignore_index=True)
		return pd.concat(datasets, axis=1)

	@staticmethod
	def get_data_from_files():
		dir = './web/uploads'
		datasets = [pd.read_csv(os.path.join(dir, f)) for f in os.listdir(dir)]
		# result = pd.concat(datasets, axis=1, ignore_index=True)
		result = pd.concat(datasets, axis=1)
		return result.to_json(orient='index')

	@staticmethod
	def run_dbscan(data, eps=15, min_samples=2):
		# tmp = data.copy().drop(columns, axis=1) if columns else data
		clustering = DBSCAN(eps=eps, min_samples=min_samples).fit(data)
		result = np.where(clustering.labels_ == -1)
		return result[0].tolist()

	@staticmethod
	def run_pca(data):
		pca = PCA(n_components=2)
		principal_components = pca.fit_transform(data)
		return pd.DataFrame(data=principal_components, columns=['x', 'y'])


if __name__ == '__main__':
	X = pd.DataFrame([[1, 2, 1], [2, 2, 3], [2, 3, 3.5], [8, '9', 8], [8, 8, 9], [25, 80, 85]])
	outliers = Util.run_dbscan(X)
	print(outliers)


