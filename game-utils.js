// les fonctions utiles pour charger des shaders et des textures

var gl; // les fonctionnalités OpenGL
var mvMatrix; // modelviewmatrix
var pMatrix; // projection matrix

// initialisation du contexte OpenGL
function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

// charge et compile les shaders
function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


function initShaders(vsId,fsId) {
    // recupere les vertex et fragment shaders
    var fragmentShader = getShader(gl,fsId);
    var vertexShader = getShader(gl,vsId);

    // cree le programme et lui associe les vertex/fragments
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram,gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    return shaderProgram;
}


function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
}


function initTexture(filename) {
    var texture = gl.createTexture();
    texture.image = new Image();

    texture.image.onload = function () {
        handleLoadedTexture(texture)
        texture.width = this.width;
        texture.height = this.height;
    }

    texture.image.src = filename;
    return texture;
}

mvMatrix = mat4.create();
var mvMatrixStack = [];
pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function degToRad(degrees) {
        return degrees * Math.PI / 180;
    }

/*

    Sounds

    The sounds class is used to asynchronously load sounds and allow
    them to be played.

*/
//  Mutes or unmutes the game.
mute = function(mute) {

    //  If we've been told to mute, mute.
    if(mute === true) {
        this.sounds.mute = true;
    } else if (mute === false) {
        this.sounds.mute = false;
    } else {
        // Toggle mute instead...
        this.sounds.mute = this.sounds.mute ? false : true;
    }
};

function Sounds() {

    //  The audio context.
    this.audioContext = null;

    //  The actual set of loaded sounds.
    this.sounds = {};
}

Sounds.prototype.init = function() {

    //  Create the audio context, paying attention to webkit browsers.
    context = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new context();
    this.mute = false;
};

Sounds.prototype.loadSound = function(name, url) {

    //  Reference to ourselves for closures.
    var self = this;

    //  Create an entry in the sounds object.
    this.sounds[name] = null;

    //  Create an asynchronous request for the sound.
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'arraybuffer';
    req.onload = function() {
        self.audioContext.decodeAudioData(req.response, function(buffer) {
            self.sounds[name] = {buffer: buffer};
        });
    };
    try {
      req.send();
    } catch(e) {
      console.log("An exception occured getting sound the sound " + name + " this might be " +
         "because the page is running from the file system, not a webserver.");
      console.log(e);
    }
};

Sounds.prototype.playSound = function(name) {

    //  If we've not got the sound, don't bother playing it.
    if(this.sounds[name] === undefined || this.sounds[name] === null || this.mute === true) {
        return;
    }

    //  Create a sound source, set the buffer, connect to the speakers and
    //  play the sound.
    var source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[name].buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
};


/**
 * Detect colisions between the lasers and enemies
 */
var detectColisions = function() {
	for(indexLaser in lasers) {
		for(indexEnemy in enemies) {
			if(colisionHandler.detectColisionBetweenObjects(lasers[indexLaser], enemies[indexEnemy])) {
				lasers.splice(indexLaser, 1);
				enemies.splice(indexEnemy, 1);
				break;
			}
		}
	}
}

/**
  * Class ColisionHandler
  */
 function ColisionHandler() {

 	/**
 	 * Checks the colision between two objects
 	 * @param obj1 - first object
 	 * @param obj2 - second object
 	 */
 	this.detectColisionBetweenObjects = function(obj1, obj2) {
 		if((obj1.getPositionY() + obj1.height) < obj2.getPositionY()) {
 			return false;
 		}
 		else if(obj1.getPositionY() > (obj2.getPositionY() + obj2.height)) {
 			return false;
 		}
 		else if((obj1.getPositionX() + obj1.width) < obj2.getPositionX()) {
 			return false;
 		}
 		else if(obj1.getPositionX() > (obj2.getPositionX() + obj2.width)) {
 			return false;
 		}
 		return true;
 	}
 }
