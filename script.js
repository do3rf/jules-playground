// Coordinates of the Eiffel Tower
const eiffelTower = {
    lat: 48.8584,
    lng: 2.2945
};

/**
 * Converts degrees to radians.
 * @param {number} degrees - The angle in degrees.
 * @returns {number} The angle in radians.
 */
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Calculates the distance between two points on Earth using the Haversine formula.
 * The Haversine formula is used to calculate the great-circle distance between two points
 * on a sphere given their longitudes and latitudes. It is a more accurate method for
 * calculating distances on a sphere than the Euclidean distance formula, especially for
 * long distances.
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lon1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lon2 - Longitude of the second point.
 * @returns {number} The distance in metres.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in metres
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}

/**
 * Calculates the initial bearing (forward azimuth) from one point to another.
 * The bearing is the direction from one point to another, measured in degrees clockwise
 * from the north direction. This formula calculates the initial bearing, which if
 * followed in a straight line along a great-circle arc, will take you from the
 * start point to the end point.
 * @param {number} lat1 - Latitude of the first point.
 * @param {number} lon1 - Longitude of the first point.
 * @param {number} lat2 - Latitude of the second point.
 * @param {number} lon2 - Longitude of the second point.
 * @returns {number} The bearing in degrees.
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const λ1 = toRadians(lon1);
    const λ2 = toRadians(lon2);

    const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
    const θ = Math.atan2(y, x);
    return (θ * 180 / Math.PI + 360) % 360; // in degrees
}


// Global variable to store the bearing to the Eiffel Tower.
// This is needed because the bearing is calculated in the geolocation callback,
// but it is used in the device orientation callback.
let bearing = 0;
let smoothedHeadingX = 0;
let smoothedHeadingY = 0;
const smoothingFactor = 0.1;

// Get references to the UI elements that will be updated.
const arrow = document.getElementById('arrow');
const latEl = document.getElementById('lat');
const lonEl = document.getElementById('lon');
const rawAlphaEl = document.getElementById('raw_alpha');
const webkitChEl = document.getElementById('webkit_ch');
const bearingEl = document.getElementById('bearing');
const smoothedHeadingEl = document.getElementById('smoothed_heading');
const rotationEl = document.getElementById('rotation');


/**
 * Starts the application by setting up the geolocation and device orientation listeners.
 */
function startApp() {
    // Use watchPosition to get continuous updates of the user's location.
    // enableHighAccuracy is set to true to get the most accurate location possible.
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(position => {
            const { latitude, longitude } = position.coords;
            const distance = calculateDistance(latitude, longitude, eiffelTower.lat, eiffelTower.lng);
            bearing = calculateBearing(latitude, longitude, eiffelTower.lat, eiffelTower.lng);

            document.getElementById('distance').textContent = `Distance: ${Math.round(distance / 1000)} km`;
            latEl.textContent = latitude.toFixed(4);
            lonEl.textContent = longitude.toFixed(4);
            bearingEl.textContent = bearing.toFixed(2);

        }, error => {
            console.error(error);
            document.getElementById('distance').textContent = 'Error getting location.';
        }, {
            enableHighAccuracy: true
        });
    } else {
        alert('Geolocation is not supported by your browser');
    }

    // Listen for the deviceorientationabsolute event, which provides the device's
    // orientation in relation to the Earth's frame of reference. This is more
    // suitable for a compass than the relative deviceorientation event.
    if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientationabsolute', event => {
            // The alpha value represents the direction the device is facing in degrees,
            // from 0 to 360, where 0 is North.
            let heading = event.alpha;
            rawAlphaEl.textContent = event.alpha ? event.alpha.toFixed(2) : 'null';
            webkitChEl.textContent = event.webkitCompassHeading ? event.webkitCompassHeading.toFixed(2) : 'null';

            // For iOS devices, the webkitCompassHeading property is used instead.
            if (typeof event.webkitCompassHeading !== "undefined") {
                heading = event.webkitCompassHeading;
            }

            if (heading !== null) {
                // The rotation of the arrow is the bearing to the Eiffel Tower minus the
                // device's current heading. This ensures the arrow always points towards
                // the Eiffel Tower, regardless of the phone's orientation.
                const rotation = bearing - heading;
                arrow.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
                smoothedHeadingEl.textContent = heading.toFixed(2); // For debug purposes, show raw heading
                rotationEl.textContent = rotation.toFixed(2);
            }
        });
    } else {
        alert("Device orientation not supported");
    }
}

/**
 * Requests permission for device orientation events on iOS 13+.
 * On iOS 13 and later, apps must explicitly request permission to access
 * device orientation events. This function handles that permission request.
 */
function requestDeviceOrientationPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(permissionState => {
                if (permissionState === 'granted') {
                    startApp();
                } else {
                    alert('Permission for device orientation not granted');
                }
            })
            .catch(console.error);
    } else {
        // For non-iOS 13+ browsers, start the app directly.
        startApp();
    }
}

window.onload = () => {
    // A user interaction (like a click) is required to request device orientation
    // permission. This sets up a one-time click listener on the body to trigger
    // the permission request.
    document.body.addEventListener('click', requestDeviceOrientationPermission, { once: true });
    document.getElementById('distance').textContent = "Tap to start";
};
