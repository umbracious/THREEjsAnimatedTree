class Node {
	constructor(parentNode) {
		this.parentNode = parentNode; //Noeud parent
		this.childNode = []; //Noeud enfants

		this.p0 = null; //Position de depart de la branche
		this.p1 = null; //Position finale de la branche

		this.a0 = null; //Rayon de la branche a p0
		this.a1 = null; //Rayon de la branche a p1

		this.sections = null; //Liste contenant une liste de points representant les segments circulaires du cylindre generalise
		
		// Indexes pour la partie animation hermite
		this.indexes = [];
		this.leafIdxs = [];
		this.appleIdxs = [];

		// Matrice de transformation pour l'animation
		this.transformationMatrix = null;
	}
}

TP3.Geometry = {

	simplifySkeleton: function (rootNode, rotationThreshold = 0.0001) {
		
		var currentVector = new THREE.Vector3; 
		currentVector.subVectors(rootNode.p1,rootNode.p0);

		if (!rootNode.childNode){ // 0 Child nodes
			return; // Function ends
		}

		else if (rootNode.childNode.length == 1){ // 1 Child node
			let childNode = rootNode.childNode[0];
			var nextVector = new THREE.Vector3;
			nextVector.subVectors(childNode.p1,childNode.p0);
			var rotation = this.findRotation(currentVector, nextVector); 
			
			if (Math.abs(rotation[1])<=rotationThreshold){ // Check if rotation below threshold
				
				// Change root note parameters
				rootNode.p1 = childNode.p1;
				rootNode.a1 = childNode.a1;
				rootNode.childNode = childNode.childNode;

				// Change new child node parameters
				for (child of rootNode.childNode){
					child.parentNode = rootNode;
				}

				this.simplifySkeleton(rootNode, rotationThreshold); // Recursion
				
			}

			else{ // Rotation above threshold
				for (child of rootNode.childNode){
					this.simplifySkeleton(child, rotationThreshold);
				}
			}
		}
		
		else { // 2+ Child nodes
			for (child of rootNode.childNode){
				this.simplifySkeleton(child, rotationThreshold);
			}
		}
	},

	generateSegmentsHermite: function (rootNode, lengthDivisions = 4, radialDivisions = 8) {
		
		stack = [];
		stack.push(rootNode);

		while (stack.length>0){
			var currentNode = stack.pop();
			
			// Push children to stack
			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			// Temporary sections array
			var sections = [];
			
			// Hermite curve parameters
			var h0 = currentNode.p0;
			var h1 = currentNode.p1;
			if (currentNode != rootNode){
				var v0 = currentNode.parentNode.p1.clone().sub(currentNode.parentNode.p0);
			}
			else {
				var v0 = new THREE.Vector3(0,(h1.clone().sub(h0).length()),0); // Root node has no parent node
			}
			var v1 = currentNode.p1.clone().sub(currentNode.p0);
			
			// Transformation matrix
			if (currentNode == rootNode){
				var transformationMatrix = new THREE.Matrix3();
				
			}

			else {
				var transformationMatrix = currentNode.parentNode.transformationMatrix.clone();
			}

			// Calculate each segment
			for (i=0; i<lengthDivisions; i++){
				var points = [];

				var t = i/(lengthDivisions-1);
				
				var r = currentNode.a0 + (currentNode.a1 - currentNode.a0)*t; // Interpolated radius

				// Point and tangent of hermite function at t
				var hermite = this.hermite(h0,h1,v0,v1,t);
				var p = hermite[0];
				var dp = hermite[1];

				// Point and tangent of function at t + dt
				var dt = 1/(lengthDivisions-1);
				var hermite2 = this.hermite(h0,h1,v0,v1,t+dt);
				var dp2 = hermite2[1];
				
				// Rotation Matrix
				var rotation = this.findRotation(dp, dp2);
				var axis = rotation[0];
				var angle = rotation[1];
				var x = axis.x;
				var y = axis.y;
				var z = axis.z;
				var c = Math.cos(angle);
				var s = Math.sin(angle);
				var C = 1-c;
				
				var rotationMatrix = new THREE.Matrix3().set(
					x*x*C + c, x*y*C - z*s, x*z*C + y*s,
					y*x*C + z*s, y*y*C + c, y*z*C - x*s,
					z*x*C - y*s, z*y*C + x*s, z*z*C + c
				); 

				
	
				// Calculate each point
				for (j=0; j<radialDivisions; j++){
					var point = new THREE.Vector3(1,0,0);

					point.applyAxisAngle(new THREE.Vector3(0,1,0), 2*Math.PI/radialDivisions*j);
					point.setLength(r);
					point.applyMatrix3(transformationMatrix);
					point.add(p);
					points.push(point);
				}
				if (i<lengthDivisions-1){
					transformationMatrix.multiply(rotationMatrix);
				}
				
				sections.push(points);
			}
			currentNode.transformationMatrix = transformationMatrix.clone();
			currentNode.sections = sections;
			
		}
		
		return rootNode;
	},

	hermite: function (h0, h1, v0, v1, t) {

		// Bezier curve points
		const p0 = h0.clone(); // p0 = h0
		const p1 = h0.clone().add(v0.clone().multiplyScalar(1/3)); // p1 = h0 + v0*1/3
		const p2 = h1.clone().sub(v1.clone().multiplyScalar(1/3)); // p2 = h1 - v1*1/3
		const p3 = h1.clone(); // p3 = h1

		// First lerps
		const p0p1 = new THREE.Vector3().lerpVectors(p0, p1, t);
		const p1p2 = new THREE.Vector3().lerpVectors(p1, p2, t);
		const p2p3 = new THREE.Vector3().lerpVectors(p2, p3, t);
		
		// Second lerps
		const p0p1p2 = new THREE.Vector3().lerpVectors(p0p1, p1p2, t);
		const p1p2p3 = new THREE.Vector3().lerpVectors(p1p2, p2p3, t);

		// Final lerp
		const p = new THREE.Vector3().lerpVectors(p0p1p2, p1p2p3, t);
		
		// Tangent at point
		const p1p0 = p1.clone().sub(p0); // p1 - p0
		const p2p1 = p2.clone().sub(p1); // p2 - p1
		const p3p2 = p3.clone().sub(p2); // p3 - p2

		// dp = 3(1 - t)^2*(p1 - p0) + 6(1 - t)*t*(p2 - p1) + 3*t^2(p3 - p2)
		const dp = p1p0.clone().multiplyScalar(3*(1-t)*(1-t)).add(p2p1.clone().multiplyScalar(6*(1-t)*t)).add(p3p2.clone().multiplyScalar(3*t*t)).normalize();

		return [p, dp];
	},


	// Trouver l'axe et l'angle de rotation entre deux vecteurs
	findRotation: function (a, b) {
		const axis = new THREE.Vector3().crossVectors(a, b).normalize();
		var c = a.dot(b) / (a.length() * b.length());

		if (c < -1) {
			c = -1;
		} else if (c > 1) {
			c = 1;
		}

		const angle = Math.acos(c);

		return [axis, angle];
	},

	// Projeter un vecter a sur b
	project: function (a, b) {
		return b.clone().multiplyScalar(a.dot(b) / (b.lengthSq()));
	},

	// Trouver le vecteur moyen d'une liste de vecteurs
	meanPoint: function (points) {
		var mp = new THREE.Vector3();

		for (var i = 0; i < points.length; i++) {
			mp.add(points[i]);
		}

		return mp.divideScalar(points.length);
	},
};
