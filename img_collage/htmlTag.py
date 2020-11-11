import os

path = './SImg' 

# for r, d, f in os.walk(path):
# 	for file in f:
# 		tag = '<a href="'+os.path.join(r, file)+'"><img src="'+os.path.join(r, file)+'"></img></a>'
# 		print(tag)

for r, d, f in os.walk(path):
	for file in f:
		tag = '<div class="col-sm-6 col-md-4 col-lg-3 item"><a href="'+os.path.join(r, file)+'"data-lightbox="photos"><img class="img-fluid" src="'+os.path.join(r, file)+'"></img></a></div>'
		print(tag)