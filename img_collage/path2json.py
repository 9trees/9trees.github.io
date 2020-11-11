import os
import json

path = './SImg'
# path = os.path.join(os.getcwd(), path)
data = {}
data['fpath'] = []
i = 0

# r=root, d=directories, f = files 
for r, d, f in os.walk(path):
	for file in f:
		newFileName = "new_" + str(i) + '.' + file.split('.')[-1:][0]
		os.rename(os.path.join(r, file), os.path.join(r, newFileName))
		print(os.path.join(r, newFileName)[2:])
		data['fpath'].append({
			'fname': newFileName,
			'path': os.path.join(r, newFileName)[2:]
			})
		i += 1



filename = "newimg.json"

# If the file name exists, write a JSON string into the file.
if filename:
    # Writing JSON data
    with open(filename, 'w') as f:
        json.dump(data, f)