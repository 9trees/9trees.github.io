import os

path = './SImg' 

for r, d, f in os.walk(path):
	for file in f:
		tag = '<a href="'+os.path.join(r, file)+'"><img src="'+os.path.join(r, file)+'"></img></a>'
		print(tag)