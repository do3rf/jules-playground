const eiffelTower = {
    lat: 48.8584,
    lng: 2.2945
};

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
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


let bearing = 0;
const arrow = document.getElementById('arrow');
const latEl = document.getElementById('lat');
const lonEl = document.getElementById('lon');
const alphaEl = document.getElementById('alpha');

function startApp() {
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(position => {
            const { latitude, longitude } = position.coords;
            const distance = calculateDistance(latitude, longitude, eiffelTower.lat, eiffelTower.lng);
            bearing = calculateBearing(latitude, longitude, eiffelTower.lat, eiffelTower.lng);

            document.getElementById('distance').textContent = `Distance: ${Math.round(distance / 1000)} km`;
            latEl.textContent = latitude.toFixed(4);
            lonEl.textContent = longitude.toFixed(4);

        }, error => {
            console.error(error);
            document.getElementById('distance').textContent = 'Error getting location.';
        }, {
            enableHighAccuracy: true
        });
    } else {
        alert('Geolocation is not supported by your browser');
    }

    if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientationabsolute', event => {
            let heading = event.alpha;
            // For iOS
            if (typeof event.webkitCompassHeading !== "undefined") {
                heading = event.webkitCompassHeading;
            }
            const rotation = bearing - heading;
            arrow.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
            alphaEl.textContent = heading ? heading.toFixed(2) : 'null';
        });
    } else {
        alert("Device orientation not supported");
    }
}

// Request permission for iOS 13+
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
        // Not iOS 13+
        startApp();
    }
}

window.onload = () => {
    // On click, request permission
    document.body.addEventListener('click', requestDeviceOrientationPermission, { once: true });
    document.getElementById('distance').textContent = "Tap to start";
};
