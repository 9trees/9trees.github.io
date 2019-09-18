import os
import json

path = './SImg' 
data = {}
data['fpath'] = []

# r=root, d=directories, f = files 
for r, d, f in os.walk(path):
	for file in f:
		print(os.path.join(r, file)[2:])
		data['fpath'].append({
			'fname': file,
			'path': os.path.join(r, file)[2:]
			})



filename = "img.json"

# If the file name exists, write a JSON string into the file.
if filename:
    # Writing JSON data
    with open(filename, 'w') as f:
        json.dump(data, f)