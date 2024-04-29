TP3.Render = {
	drawTreeRough: function (rootNode, scene, alpha, radialDivisions = 8, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		
		const treeMaterial = new THREE.MeshLambertMaterial({color: 0x8B5A2B});
		const leafMaterial = new THREE.MeshPhongMaterial({color: 0x3A5F0B});
		const appleMaterial = new THREE.MeshPhongMaterial({color: 0x5F0B0B});
		
		const stack = [];
		stack.push(rootNode);
		const branches = [];
		const leaves = [];
		const apples = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}
			
			// Cylinder Geometry
			var direction = new THREE.Vector3().subVectors(currentNode.p1, currentNode.p0); 
			var cylGeometry = new THREE.CylinderBufferGeometry(currentNode.a1, currentNode.a0 , direction.length(), radialDivisions); // Make Cylinder Geometry
			cylGeometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0, direction.length() / 2, 0)); // Place bottom center of cylinder at (0,0,0)
			cylGeometry.applyMatrix4(new THREE.Matrix4().makeRotationX(THREE.Math.degToRad(90))); // Pre-rotate for lookAt method to work
			cylGeometry.lookAt(direction); // Look at p1
			cylGeometry.translate(currentNode.p0.x,currentNode.p0.y,currentNode.p0.z); // Translate to p0
			
			branches.push(cylGeometry);
			
			if (currentNode.a0 < alpha*leavesCutoff){
				// Leaf geometry
				for (var i=0; i<leavesDensity; i++){
					
					// Initialize buffer
					var leafGeometry = new THREE.PlaneBufferGeometry(alpha,alpha);

					// Random Rotation
					leafGeometry.rotateX(Math.random()*2*Math.PI);
					leafGeometry.rotateY(Math.random()*2*Math.PI);
					leafGeometry.rotateZ(Math.random()*2*Math.PI);
					
					// Random Translation
					var perp = new THREE.Vector3().crossVectors(direction, 
						new THREE.Vector3().random()); // Vector perpedicular to direction vector
					perp.setLength(alpha/2*Math.random());
					var randDir = new THREE.Vector3().copy(direction);
					if (currentNode.childNode.length == 0){ // Leaf node
						randDir.setLength((direction.length()+alpha)*Math.random());
					}

					else{
						randDir.setLength(direction.length()*Math.random());
					}
					
					var leafPos = new THREE.Vector3().add(currentNode.p0).add(randDir).add(perp); // Leaf Position
					leafGeometry.translate(leafPos.x, leafPos.y, leafPos.z);
					
					// Add to leaves array
					leaves.push(leafGeometry);
				}
			

				// Apple
				if (Math.random()<applesProbability){
					
					// Initialize buffer
					var appleGeometry = new THREE.BoxBufferGeometry(alpha,alpha,alpha);
					
					// Random Rotation
					appleGeometry.rotateX(Math.random()*2*Math.PI);
					appleGeometry.rotateY(Math.random()*2*Math.PI);
					appleGeometry.rotateZ(Math.random()*2*Math.PI);
					
					// Random Translation
					var perp = new THREE.Vector3().crossVectors(direction, 
						new THREE.Vector3().random()); // Vector perpedicular to direction vector
					perp.setLength(alpha/2*Math.random());
					var randDir = new THREE.Vector3().copy(direction);
					randDir.setLength(direction.length()*Math.random());
					var applePos = new THREE.Vector3().add(currentNode.p0).add(randDir).add(perp); // Apple Position
					appleGeometry.translate(applePos.x, applePos.y, applePos.z);

					// Add to scene
					apples.push(appleGeometry);
				}
			}
			
			
		}	
		
		// Add tree to scene
		var treeGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(branches, false);
		var tree = new THREE.Mesh(treeGeometry, treeMaterial);
		tree.applyMatrix4(matrix);
		scene.add(tree);

		// Add leaves to scene
		var leavesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(leaves, false);
		var leavesMesh = new THREE.Mesh(leavesGeometry, leafMaterial);
		leavesMesh.applyMatrix4(matrix);
		scene.add(leavesMesh);

		// Add apples to scene
		var applesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(apples, false);
		var applesMesh = new THREE.Mesh(applesGeometry, appleMaterial);
		applesMesh.applyMatrix4(matrix);
		scene.add(applesMesh);
	},

	drawTreeHermite: function (rootNode, scene, alpha, leavesCutoff = 0.1, leavesDensity = 10, applesProbability = 0.05, matrix = new THREE.Matrix4()) {
		
		// Materials
		const treeMaterial = new THREE.MeshLambertMaterial({color: 0x8B5A2B});
		const leafMaterial = new THREE.MeshPhongMaterial({color: 0x3A5F0B, side: THREE.DoubleSide});
		const appleMaterial = new THREE.MeshPhongMaterial({color: 0x5F0B0B});
		
		const stack = [];
		stack.push(rootNode);
		const branches = [];
		const leaves = [];
		const apples = [];
		var treeFacesIdx = [];
		var index = 0;
		var leafIndex = 0;
		var appleIndex = 0;

		while (stack.length > 0) {
			
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}
			

			// Branch direction for leaf/apple placement
			var direction = new THREE.Vector3().subVectors(currentNode.p1, currentNode.p0);

			// Push every point to index and update indexes
			if (currentNode == rootNode){ // Skip the first segment of every non root node to avoid duplicate segments

				// Add p0 as a point to fill bottom face
				branches.push(currentNode.p0.x, currentNode.p0.y, currentNode.p0.z);
				currentNode.indexes.push([index]);
				index++;

				for (var i=0;i<currentNode.sections.length;i++){
					var indexes = [];

					for (point of currentNode.sections[i]){
						branches.push(point.x,point.y,point.z);
						indexes.push(index);
						index++;
					}

					currentNode.indexes.push(indexes);
				}
			}

			else {

				for (var i=1;i<currentNode.sections.length;i++){
		
					var indexes = [];
					
					for (point of currentNode.sections[i]){
						branches.push(point.x,point.y,point.z);
						indexes.push(index);
						index++;
					}

					currentNode.indexes.push(indexes);
				}
				
				// Add P1 to array to fill in end nodes
				if (currentNode.childNode == 0){
					branches.push(currentNode.p1.x, currentNode.p1.y, currentNode.p1.z);
					currentNode.indexes.push([index]);
					index++;
				}
			}
			
			// Add faces to facesIdx
			if (currentNode == rootNode){ // Root Node

				// Add bottom face
				for (var i = 0; i<currentNode.indexes[1].length; i++){
					if (i != currentNode.indexes[1].length - 1){
						treeFacesIdx.push(currentNode.indexes[0][0], currentNode.indexes[1][i+1], currentNode.indexes[1][i]);
					}

					else{
						treeFacesIdx.push(currentNode.indexes[0][0], currentNode.indexes[1][0], currentNode.indexes[1][i]);
					}
				}

				for (var i = 1; i<currentNode.indexes.length-1; i++){
					for (var j = 0; j<currentNode.indexes[i].length; j++){
						if (j==currentNode.indexes[i].length-1){
							treeFacesIdx.push(currentNode.indexes[i][j], currentNode.indexes[i+1][0], currentNode.indexes[i+1][j]);
							treeFacesIdx.push(currentNode.indexes[i][j], currentNode.indexes[i][0], currentNode.indexes[i+1][0]);
						}

						else{
							treeFacesIdx.push(currentNode.indexes[i][j], currentNode.indexes[i][j+1], currentNode.indexes[i+1][j+1]);
							treeFacesIdx.push(currentNode.indexes[i][j], currentNode.indexes[i+1][j+1], currentNode.indexes[i+1][j]);
						}
						
					}
				}
			
			}

			else {

				let indexesLength = currentNode.indexes.length;

				if (currentNode.childNode.length == 0){
					// Decrement indexes length to ignore last element of array in for loop
					indexesLength--;

					// Add end face
					for (var i = 0; i < currentNode.indexes[currentNode.indexes.length - 2].length; i++){
						if (i == currentNode.indexes[currentNode.indexes.length - 2].length - 1){
							treeFacesIdx.push(currentNode.indexes[currentNode.indexes.length - 1][0], currentNode.indexes[currentNode.indexes.length - 2][i], currentNode.indexes[currentNode.indexes.length - 2][0]);
						}

						else{
							treeFacesIdx.push(currentNode.indexes[currentNode.indexes.length - 1][0], currentNode.indexes[currentNode.indexes.length - 2][i], currentNode.indexes[currentNode.indexes.length - 2][i+1]);
						}
					}

				}

				for (var i = 0; i<indexesLength; i++){
					for (var j = 0; j<currentNode.indexes[i].length;j++){
						if (i==0){
							if (j==currentNode.indexes[i].length-1){
								treeFacesIdx.push(currentNode.parentNode.indexes[currentNode.parentNode.indexes.length-1][j], currentNode.parentNode.indexes[currentNode.parentNode.indexes.length-1][0], currentNode.indexes[i][0]);
								treeFacesIdx.push(currentNode.parentNode.indexes[currentNode.parentNode.indexes.length-1][j], currentNode.indexes[i][0], currentNode.indexes[i][j]);
							}
							else{
								treeFacesIdx.push(currentNode.parentNode.indexes[currentNode.parentNode.indexes.length-1][j], currentNode.parentNode.indexes[currentNode.parentNode.indexes.length-1][j+1], currentNode.indexes[i][j+1]);
								treeFacesIdx.push(currentNode.parentNode.indexes[currentNode.parentNode.indexes.length-1][j], currentNode.indexes[i][j+1], currentNode.indexes[i][j]);
							}
						}
						
						else{
							if (j==currentNode.indexes[i].length-1){
								treeFacesIdx.push(currentNode.indexes[i-1][j], currentNode.indexes[i-1][0], currentNode.indexes[i][0]);
								treeFacesIdx.push(currentNode.indexes[i-1][j], currentNode.indexes[i][0], currentNode.indexes[i][j]);
							}
							else{
								treeFacesIdx.push(currentNode.indexes[i-1][j], currentNode.indexes[i-1][j+1], currentNode.indexes[i][j+1]);
								treeFacesIdx.push(currentNode.indexes[i-1][j], currentNode.indexes[i][j+1], currentNode.indexes[i][j]);
							}
						}
					}
				}
			}

			if (currentNode.a0 < alpha*leavesCutoff){

				// Leaf geometry
				for (var i=0; i<leavesDensity; i++){

					// Initialize triangle buffer for leaf
					var leafCorners = [];
					var p1 = new THREE.Vector3(alpha*Math.sqrt(3)/3, 0.0, 0.0);
					var p2 = p1.clone().applyAxisAngle(new THREE.Vector3(0,1,0), 2*Math.PI/3);
					var p3 = p2.clone().applyAxisAngle(new THREE.Vector3(0,1,0), 2*Math.PI/3);
					leafCorners.push(p1.x, p1.y, p1.z);
					leafCorners.push(p2.x, p2.y, p2.z);
					leafCorners.push(p3.x, p3.y, p3.z);
					var f32leafCorners = new Float32Array(leafCorners);
					var leafGeometry = new THREE.BufferGeometry();
					leafGeometry.setAttribute("position", new THREE.BufferAttribute(f32leafCorners, 3));

					// Initialize buffer face
					var facesIdx = [];
					facesIdx.push(0,1,2);

					// Add indexes to currentNode for animation
					currentNode.leafIdxs.push([leafIndex,leafIndex+1,leafIndex+2]);
					leafIndex += 3;

					leafGeometry.setIndex(facesIdx);
					leafGeometry.computeVertexNormals();

					// Random Rotation
					leafGeometry.rotateX(Math.random()*2*Math.PI);
					leafGeometry.rotateY(Math.random()*2*Math.PI);
					leafGeometry.rotateZ(Math.random()*2*Math.PI);
					
					// Random Translation
					var perp = new THREE.Vector3().crossVectors(direction, 
						new THREE.Vector3().random()); // Vector perpedicular to direction vector
					perp.setLength(alpha/2*Math.random());
					var randDir = new THREE.Vector3().copy(direction);
					if (currentNode.childNode.length == 0){
						randDir.setLength((direction.length()+alpha)*Math.random());
					}

					else{
						randDir.setLength(direction.length()*Math.random());
					} 
					
					var leafPos = new THREE.Vector3().add(currentNode.p0).add(randDir).add(perp); // Leaf Position
					leafGeometry.translate(leafPos.x, leafPos.y, leafPos.z);
					
					// Add to leaves array
					leaves.push(leafGeometry);
				}

				// Apple Geometry
				if (Math.random()<applesProbability){

					// Initialize sphere buffer for apple
					var appleGeometry = new THREE.SphereBufferGeometry(alpha/2);
					currentNode.appleIdxs.push(appleIndex);
					appleIndex+=63; // Number of points in a Sphere Buffer Geometry

					// Random Translation
					var perp = new THREE.Vector3().crossVectors(direction, new THREE.Vector3().random()); // Vector perpedicular to direction vector
					perp.setLength(alpha/2*Math.random());
					var randDir = new THREE.Vector3().copy(direction);
					randDir.setLength(direction.length()*Math.random());
					var applePos = new THREE.Vector3().add(currentNode.p0).add(randDir).add(perp); // Leaf Position
					appleGeometry.translate(applePos.x, applePos.y, applePos.z);

					// Add to scene
					apples.push(appleGeometry);
				}
			}
			
			
		}	

		// Initialize buffer
		var f32branches = new Float32Array(branches);
		var treeGeometry = new THREE.BufferGeometry();
		treeGeometry.setAttribute("position", new THREE.BufferAttribute(f32branches, 3));
		
		// Indexes
		treeGeometry.setIndex(treeFacesIdx);
		treeGeometry.computeVertexNormals();

		// Add tree to scene
		var treeMesh = new THREE.Mesh(treeGeometry, treeMaterial);
		treeMesh.applyMatrix4(matrix);
		scene.add(treeMesh);

		// Add leaves to scene
		var leavesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(leaves, false);
		var leavesMesh = new THREE.Mesh(leavesGeometry, leafMaterial);
		leavesMesh.applyMatrix4(matrix);
		scene.add(leavesMesh);

		// Add apples to scene
		var applesGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(apples, false);
		var applesMesh = new THREE.Mesh(applesGeometry, appleMaterial);
		applesMesh.applyMatrix4(matrix);
		scene.add(applesMesh);

		return [treeGeometry, leavesGeometry, applesGeometry];
	},

	updateTreeHermite: function (trunkGeometryBuffer, leavesGeometryBuffer, applesGeometryBuffer, rootNode) {

		var stack = [];
		stack.push(rootNode);

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			for (array of currentNode.indexes){
				for (index of array){

					// Get x, y and z values of point at index
					var x = trunkGeometryBuffer[index*3];
					var y = trunkGeometryBuffer[index*3+1];
					var z = trunkGeometryBuffer[index*3+2];

					// Create temporary point to apply transformation matrix onto
					var tmp = new THREE.Vector3(x,y,z);
					tmp.applyMatrix4(currentNode.transformationMatrix);

					// Change old values to new values
					trunkGeometryBuffer[index*3] = tmp.x;
					trunkGeometryBuffer[index*3+1] = tmp.y;
					trunkGeometryBuffer[index*3+2] = tmp.z;

				}
			}

			for (leaf of currentNode.leafIdxs){
				for (index of leaf){

					// Get x, y and z values of point at index
					var x = leavesGeometryBuffer[index*3];
					var y = leavesGeometryBuffer[index*3+1];
					var z = leavesGeometryBuffer[index*3+2];

					// Create temporary point to apply transformation matrix onto
					var tmp = new THREE.Vector3(x,y,z);
					tmp.applyMatrix4(currentNode.transformationMatrix);

					// Change old values to new values
					leavesGeometryBuffer[index*3] = tmp.x;
					leavesGeometryBuffer[index*3+1] = tmp.y;
					leavesGeometryBuffer[index*3+2] = tmp.z;

				}
			}

			for (apple of currentNode.appleIdxs){
				for (var index=apple; index<apple+63;index++){
					// Get x, y and z values of point at index
					var x = applesGeometryBuffer[index*3];
					var y = applesGeometryBuffer[index*3+1];
					var z = applesGeometryBuffer[index*3+2];

					// Create temporary point to apply transformation matrix onto
					var tmp = new THREE.Vector3(x,y,z);
					tmp.applyMatrix4(currentNode.transformationMatrix);

					// Change old values to new values
					applesGeometryBuffer[index*3] = tmp.x;
					applesGeometryBuffer[index*3+1] = tmp.y;
					applesGeometryBuffer[index*3+2] = tmp.z;
				}
			}


			
		}
		
		
	},

	drawTreeSkeleton: function (rootNode, scene, color = 0xffffff, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.LineBasicMaterial({ color: color });
		var line = new THREE.LineSegments(geometry, material);
		line.applyMatrix4(matrix);
		scene.add(line);

		return line.geometry;
	},

	updateTreeSkeleton: function (geometryBuffer, rootNode) {

		var stack = [];
		stack.push(rootNode);

		var idx = 0;
		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}
			geometryBuffer[idx * 6] = currentNode.p0.x;
			geometryBuffer[idx * 6 + 1] = currentNode.p0.y;
			geometryBuffer[idx * 6 + 2] = currentNode.p0.z;
			geometryBuffer[idx * 6 + 3] = currentNode.p1.x;
			geometryBuffer[idx * 6 + 4] = currentNode.p1.y;
			geometryBuffer[idx * 6 + 5] = currentNode.p1.z;

			idx++;
		}
	},


	drawTreeNodes: function (rootNode, scene, color = 0x00ff00, size = 0.05, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			points.push(currentNode.p0);
			points.push(currentNode.p1);

		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.PointsMaterial({ color: color, size: size });
		var points = new THREE.Points(geometry, material);
		points.applyMatrix4(matrix);
		scene.add(points);

	},


	drawTreeSegments: function (rootNode, scene, lineColor = 0xff0000, segmentColor = 0xffffff, orientationColor = 0x00ff00, matrix = new THREE.Matrix4()) {

		var stack = [];
		stack.push(rootNode);

		var points = [];
		var pointsS = [];
		var pointsT = [];

		while (stack.length > 0) {
			var currentNode = stack.pop();

			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			const segments = currentNode.sections;
			for (var i = 0; i < segments.length - 1; i++) {
				points.push(TP3.Geometry.meanPoint(segments[i]));
				points.push(TP3.Geometry.meanPoint(segments[i + 1]));
			}
			for (var i = 0; i < segments.length; i++) {
				pointsT.push(TP3.Geometry.meanPoint(segments[i]));
				pointsT.push(segments[i][0]);
			}

			for (var i = 0; i < segments.length; i++) {

				for (var j = 0; j < segments[i].length - 1; j++) {
					pointsS.push(segments[i][j]);
					pointsS.push(segments[i][j + 1]);
				}
				pointsS.push(segments[i][0]);
				pointsS.push(segments[i][segments[i].length - 1]);
			}
		}

		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var geometryS = new THREE.BufferGeometry().setFromPoints(pointsS);
		var geometryT = new THREE.BufferGeometry().setFromPoints(pointsT);

		var material = new THREE.LineBasicMaterial({ color: lineColor });
		var materialS = new THREE.LineBasicMaterial({ color: segmentColor });
		var materialT = new THREE.LineBasicMaterial({ color: orientationColor });

		var line = new THREE.LineSegments(geometry, material);
		var lineS = new THREE.LineSegments(geometryS, materialS);
		var lineT = new THREE.LineSegments(geometryT, materialT);

		line.applyMatrix4(matrix);
		lineS.applyMatrix4(matrix);
		lineT.applyMatrix4(matrix);

		scene.add(line);
		scene.add(lineS);
		scene.add(lineT);

	}
}