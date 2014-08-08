var Morse = (function() {
	var Letters = {
		a: parseInt('11101', 2),				// •-
		b: parseInt('101010111', 2),			// -•••
		c: parseInt('10111010111', 2),			// -•-•
		d: parseInt('1010111', 2),				// -••
		e: parseInt('1', 2),					// •
		f: parseInt('101110101', 2),			// ••-•
		g: parseInt('101110111', 2),			// --•
		h: parseInt('1010101', 2),				// ••••
		i: parseInt('101', 2),					// ••
		j: parseInt('1110111011101', 2),		// •---
		k: parseInt('111010111', 2),			// -•-
		l: parseInt('101011101', 2),			// •-••
		m: parseInt('1110111', 2),				// --
		n: parseInt('10111', 2),				// -•
		o: parseInt('11101110111', 2),			// ---
		p: parseInt('10111011101', 2),			// •--•
		q: parseInt('1110101110111', 2),		// --•-
		r: parseInt('1011101', 2),				// •-•
		s: parseInt('10101', 2),				// •••
		t: parseInt('111', 2),					// -
		u: parseInt('1110101', 2),				// ••-
		v: parseInt('111010101', 2),			// •••-
		w: parseInt('111011101', 2),			// •--
		x: parseInt('11101010111', 2),			// -••-
		y: parseInt('1110111010111', 2),		// -•--
		z: parseInt('10101110111', 2),			// --••
		1: parseInt('11101110111011101', 2),	// •----
		2: parseInt('111011101110101', 2),		// ••---
		3: parseInt('1110111010101', 2),		// •••--
		4: parseInt('11101010101', 2),			// ••••-
		5: parseInt('101010101', 2),			// •••••
		6: parseInt('10101010111', 2),			// -••••
		7: parseInt('1010101110111', 2),		// --•••
		8: parseInt('101011101110111', 2),		// ---••
		9: parseInt('10111011101110111', 2),	// ----•
		0: parseInt('1110111011101110111', 2),	// -----
		' ': parseInt('0', 2)
	};
	
	function Signal(state, duration) {
		this.state = state || 0;
		this.duration = duration || 0;
	};
	
	var Morse = {};
	Morse.tempo = 80;
	Morse.letters = Letters;
	Morse.doPulse = false;
	Morse.doStream = true;
	Morse.streamActive = false;
	Morse.streamSignal = [];
	Morse.streamTimeouts = [];
	
	Morse.encode = function(binary) {
		var digit = binary;
		var temp = 0;
		var string = '';
		function ditOrDah(x) {
			if (1 === x) return '• ';
			if (3 === x) return '– ';	
			return '';			 
		};
		
		while (digit > 0) {
			if (digit & 1) temp++;
			else {
				string += ditOrDah(temp);
				temp = 0;
			}
			digit >>= 1;
		}
		string += ditOrDah(temp);
		return string.trim();
	};
	
	Morse.transmit = function(binary) {
		var signals = [];
		var state = 0;
		var duration = Morse.tempo;
		function testDigit(b) {
			if ((binary & 1) !== state) {
				signals.push(new Signal(state, duration));
				state = binary & 1;
				duration = Morse.tempo;
			} else {
				duration += Morse.tempo;
			}			
		};
		
		while (binary > 0) {
			testDigit(binary);
			binary >>= 1;
		}
		testDigit(binary);
		signals.push(new Signal(0, 2 * Morse.tempo));
		
		return signals;
	};
	
	Morse.pulse = function(elem) {
		if (elem) Morse.pulseElement = $(elem);
		if (Morse.pulseElement.hasClass('on')) Morse.pulseElement.removeClass('on');
		else Morse.pulseElement.addClass('on');
		if (Morse.doPulse) Morse.pulseTimeout = setTimeout(Morse.pulse, Morse.tempo);
		else if (Morse.pulseElement.hasClass('on')) Morse.pulse();
		return true;
	};
	
	Morse.stream = function(elem) {
		if (elem) Morse.streamElement = $(elem);
		if ('undefined' === typeof(Morse.streamElement)) return false;
		if (Morse.doStream && Morse.streamSignal.length) {
			Morse.streamActive = true;
			var signal = Morse.streamSignal.shift();
			if (signal.state) {
				Morse.streamElement.addClass('on');
				if (Morse.tempo < signal.duration) Morse.audioDah.play();
				else Morse.audioDit.play();
			} else Morse.streamElement.removeClass('on');
			Morse.streamTimeouts.push(setTimeout(Morse.stream, signal.duration));
		} else {
			for (var i=0; i < Morse.streamTimeouts.length; i++) {
				clearTimeout(Morse.streamTimeouts[i]);
				Morse.streamElement.removeClass('on');
				Morse.streamActive = false;
			}
		}
		return true;
	};
	
	Morse.addSignalToStream = function(state, duration) {
		var signal;
		if (Signal === state.constructor) signal = state;
		else signal = new Signal(state, duration);
		Morse.streamSignal.push(signal);
		if (!Morse.streamActive) Morse.stream();
		return signal;
	};
	
	Morse.random = function(){
	    var x = Math.floor(65 + Math.random() * 26);
	    var c = String.fromCharCode(x).toLowerCase();
	    var t = Morse.transmit(Morse.letters[c]);
	    for (var i = 0; i < t.length; i++) {
	        Morse.addSignalToStream(t[i]);
	    }
	}
	
	function Tone(duration) {
		var duration = duration | 1;
		var audio = new Audio(); // create the HTML5 audio element
		var wave = new RIFFWAVE(); // create an empty wave file
		var data = []; // yes, it's an array
		
		wave.header.sampleRate = 44100; // set sample rate to 44KHz
		wave.header.numChannels = 1; // two channels (stereo)
		
		var i = 0;
		while (i < 44.1 * Morse.tempo * duration) { 
			data[i++] = 128 + Math.round(127 * Math.sin(i / 8));
		}
		
		wave.Make(data); // make the wave file
		audio.src = wave.dataURI; // set audio source
		audio.volume = 0.1;
		return audio;
	};
	
	Morse.audioDit = new Tone(1);
	Morse.audioDah = new Tone(3);
		
	return Morse;
})();

$(function(e) {
	Morse.streamElement = $('#bulb');	// this is kludgey!!!
	$(this).keydown(function(e) {
		if (13 === e.keyCode) Morse.random();
		var key = String.fromCharCode(e.keyCode).toLowerCase();
		var keyBinary = Morse.letters[key];
		var keySignals = Morse.transmit(keyBinary);
		for (var i = 0; i < keySignals.length; i++) {
			Morse.addSignalToStream(keySignals[i]);
		}
		$('#keypressed').text(key);
		$('#morse').text(Morse.encode(keyBinary));
	});
	$('#pulse').change(function(e) {
		console.log($(this));
		if ($(this).filter(':checked').length) {
			Morse.doPulse = true;
			Morse.pulse($('#bulb'));
		} else Morse.doPulse = false;
	});
});