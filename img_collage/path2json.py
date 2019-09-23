import os
import json

path = './SImg' 
data = {}
data['fpath'] = []
i = 0

# r=root, d=directories, f = files 
for r, d, f in os.walk(path):
	for file in f:
		nfname = str(i) + '.' + file.split('.')[-1:][0]
		os.rename(os.path.join(r, file), os.path.join(r, nfname))
		print(os.path.join(r, nfname)[2:])
		data['fpath'].append({
			'fname': nfname,
			'path': os.path.join(r, nfname)[2:]
			})
		i += 1



filename = "nimg.json"

# If the file name exists, write a JSON string into the file.
if filename:
    # Writing JSON data
    with open(filename, 'w') as f:
        json.dump(data, f)