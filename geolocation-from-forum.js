/*! Geolocation macro set for SugarCube 2.x */
(function () {
	'use strict';

	// SugarCube check: if the SugarCube version isn't correct, bail out now
	if (
		   typeof version === 'undefined'
		|| typeof version.title === 'undefined' || version.title !== 'SugarCube'
		|| typeof version.major === 'undefined' || version.major < 2
		|| typeof version.minor === 'undefined' || version.minor < 5
	) {
		throw new Error('Geolocation macro set requires SugarCube 2.5.0 or greater, aborting load');
	}


	/***************************************************************************
	 * MACRO SETUP
	 **************************************************************************/
	/* The geolocation API appears to be available, setup the macros. */
	if ('geolocation' in navigator && typeof navigator.geolocation.watchPosition === 'function') {
		var
			// Geolocation position options (user configurable).
			glOptions = {
				// Whether we want to receive the most accurate results possible.  Enabling
				// this may result in slower response times or increased power consumption.
				enableHighAccuracy : false, // default: false

				// Cached results may not be older than the specified value (in milliseconds).
				maximumAge : 0, // default: 0

				// The maximum length of time (in milliseconds) that the device is allowed to
				// take in order to respond with position data.
				timeout : Infinity // default: Infinity
			},

			// ID of the running `watchPosition()` method, if any.
			glWatchId = null;

		/*
			<<glstart>>
		*/
		Macro.add('glstart', {
			handler : function () {
				// A watch is already running, so return.
				if (glWatchId !== null) {
					return;
				}

				// If it does not already exist, we give `$location` an initial value, so
				// trying to access it immediately does not cause issues if the first
				// success callback takes a while—since the geolocation API is asynchronous.
				if (!State.variables.hasOwnProperty('location')) {
					State.variables.location = {
						accuracy         : 0,
						altitude         : null,
						altitudeAccuracy : null,
						heading          : null,
						latitude         : 0,
						longitude        : 0,
						speed            : null
					};
				}

				// Success callback.
				function onSuccess(position) {
					var
						// These are reference types, so caching them is OK.
						svl = State.variables.location,
						glc = position.coords;

					// Assign the geolocation coordinate properties to the `$location` object.
					svl.accuracy         = glc.accuracy;
					svl.altitude         = glc.altitude;
					svl.altitudeAccuracy = glc.altitudeAccuracy;
					svl.heading          = glc.heading;
					svl.latitude         = glc.latitude;
					svl.longitude        = glc.longitude;
					svl.speed            = glc.speed;

					// Trigger a global `tw:geolocationupdate` event.
					jQuery.event.trigger('tw:geolocationupdate');
				}

				// Error callback.
				function onError(error) {
					/* currently a no-op; code that handles errors */
				}

				// Register a watch.
				glWatchId = navigator.geolocation.watchPosition(onSuccess, onError, glOptions);
			}
		});

		/*
			<<glstop>>
		*/
		Macro.add('glstop', {
			handler : function () {
				if (glWatchId !== null) {
					navigator.geolocation.clearWatch(glWatchId);
					glWatchId = null;
				}
			}
		});

		/*
			<<glupdate>>
		*/
		Macro.add('glupdate', {
			tags    : null,
			handler : function () {
				// Custom debug view setup.
				if (Config.debug) {
					this.debugView.modes({ block : true });
				}

				var
					contents = this.payload[0].contents,
					$wrapper = jQuery(document.createElement('span'));

				$wrapper
					.addClass('macro-' + this.name)
					.wiki(contents)
					.appendTo(this.output);

				jQuery(document).on('tw:geolocationupdate', function () {
					var frag = document.createDocumentFragment();
					new Wikifier(frag, contents);
					$wrapper.empty().append(frag);
				});
			}
		});
	}

	/* The geolocation API appears to be missing or disabled, setup no-op macros. */
	else {
		Macro.add(['glstart', 'glstop'], {
			handler : function () { /* empty */ }
		});
		Macro.add('glupdate', {
			tags    : null,
			handler : function () { /* empty */ }
		});
	}
}());