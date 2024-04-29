const appleMass = 0.075;

TP3.Physics = {
	initTree: function (rootNode) {

		this.computeTreeMass(rootNode);

		var stack = [];
		stack.push(rootNode);

		while (stack.length > 0) {
			var currentNode = stack.pop();
			for (var i = 0; i < currentNode.childNode.length; i++) {
				stack.push(currentNode.childNode[i]);
			}

			currentNode.vel = new THREE.Vector3();
			currentNode.strength = currentNode.a0;
			currentNode.initDir = currentNode.p1.clone().sub(currentNode.p0).normalize();
		}
	},

	computeTreeMass: function (node) {
		var mass = 0;

		for (var i = 0; i < node.childNode.length; i++) {
			mass += this.computeTreeMass(node.childNode[i]);
		}
		mass += node.a1;
		if (node.appleIndices !== null) {
			mass += appleMass;
		}
		node.mass = mass;

		return mass;
	},

	applyForces: function (node, dt, time) {

		var u = Math.sin(1 * time) * 4;
		u += Math.sin(2.5 * time) * 2;
		u += Math.sin(5 * time) * 0.4;

		var v = Math.cos(1 * time + 56485) * 4;
		v += Math.cos(2.5 * time + 56485) * 2;
		v += Math.cos(5 * time + 56485) * 0.4;

		// Ajouter le vent
		node.vel.add(new THREE.Vector3(u / Math.sqrt(node.mass), 0, v / Math.sqrt(node.mass)).multiplyScalar(dt));
		// Ajouter la gravite
		node.vel.add(new THREE.Vector3(0, -node.mass, 0).multiplyScalar(dt));

		///////////////////////////////////////////

		var p0 = node.p0.clone();
		var p1 = node.p1.clone();
		var p1tdt = p1.clone().add(node.vel.clone().multiplyScalar(dt)); // p1(t + dt) = p1(t) + v*dt
		
		// Create rotation matrix
		var newDirection = p1tdt.clone().sub(p0).normalize();
		var oldDirection = p1.clone().sub(p0).normalize();
		var [axis, angle] = TP3.Geometry.findRotation(oldDirection, newDirection);
		var rotationMatrix = new THREE.Matrix4().makeRotationAxis(axis,angle);

		// Create transformation matrix (sub p0, apply rotation and then add p0)
		var subP0 = new THREE.Matrix4().makeTranslation(p0.x, p0.y, p0.z);
		var addP0 = new THREE.Matrix4().makeTranslation(-p0.x, -p0.y, -p0.z);
		var transformationMatrix = new THREE.Matrix4().multiply(subP0).multiply(rotationMatrix).multiply(addP0);
		
		if (node.parentNode){
			transformationMatrix.premultiply(node.parentNode.transformationMatrix);
		}

		node.transformationMatrix = transformationMatrix;

		// Apply rotation to p1 to change position without affecting length of branch
		var newP1 = p1.clone().sub(p0).applyMatrix4(rotationMatrix).add(p0);
		var newP1P1	= newP1.clone().sub(p1); // Axis on which to project velocity and restitution force

		// Create new velocity in the opposite direction proportional to the squared angle
		var [oppositeAxis, oppositeAngle] = TP3.Geometry.findRotation(newDirection, node.initDir);
		var oppositeRotation = new THREE.Matrix4().makeRotationAxis(oppositeAxis, oppositeAngle*oppositeAngle); // Opposite rotation matrix
		var oppositeP1 = p1.clone().sub(p0).applyMatrix4(oppositeRotation).add(p0); // Apply opposite rotation to p1 to get restitution p1
		var restitutionForce = oppositeP1.clone().sub(p1); // Find velocity between original p1 and restitution p1
		restitutionForce.multiplyScalar(node.a0 * 1000); // Scale vector based on branch base size

		// Add opposite vector and apply dampening
		node.vel = TP3.Geometry.project(node.vel, newP1P1); // Project node.vel onto new Axis
		node.vel.add(restitutionForce);
		node.vel.multiplyScalar(0.7);

		// Apply transformation matrix to node
		node.p0.applyMatrix4(node.transformationMatrix);
		node.p1.applyMatrix4(node.transformationMatrix);

		// Appel recursif sur les enfants
		for (var i = 0; i < node.childNode.length; i++) {
			this.applyForces(node.childNode[i], dt, time);
		}
	}
}