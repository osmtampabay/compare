var map;

L.Control.Attribution.prototype.options.prefix = '';

var osmLayer = new L.TileLayer(
      'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {maxZoom: 18, attribution: 'Map data &copy; 2011 OpenStreetMap contributors.'}),
    omap = new L.Map('osm').addLayer(osmLayer),
    lat = 27.8, lng = -82.6, z = 10;

if (location.hash.match(/,/g)) {
    var pts = location.hash.slice(1).split(',');
    location.hash = [pts[2], pts[0], pts[1]].join('/');
}

omap.setView([lat, lng], z).addHash();

var gmap = new google.maps.Map(document.getElementById('google'), {
  center: new google.maps.LatLng(omap.getCenter().lat, omap.getCenter().lng),
  zoom: z,
  mapTypeId: google.maps.MapTypeId.ROADMAP
});

var omapLock = 0, gmapLock = 0;
var omapMove = function(e) {
  if (omapLock > Date.now()) return;
  gmapLock = Date.now() + 40;
  var c = omap.getCenter();
  var z = omap.getZoom();
  gmap.panTo(new google.maps.LatLng(c.lat, c.lng));
  gmap.setZoom(z);
};

var gmapMove = function() {
  if (gmapLock > Date.now()) return;
  omapLock = Date.now() + 40;
  var c = gmap.getCenter();
  omap.setView(new L.LatLng(c.lat(), c.lng()), gmap.getZoom());
};

omap.on('moveend', omapMove);
google.maps.event.addListener(gmap, 'center_changed', gmapMove);
google.maps.event.addListener(gmap, 'zoom_changed', gmapMove);

function geolookup(e) {
  var query = $('#search input[type=text]').val(),
      url = 'http://open.mapquestapi.com/nominatim/v1/search?format=json&json_callback=callback&limit=1&q=';
  $.ajax({
      url: url + query,
      dataType: 'jsonp',
      jsonpCallback: 'callback',
      success: function (value) {
          var v = value[0];
          if (value === undefined) {
              alert('Could not find ' + query);
          } else {
            var z = 13;
            if (v.type == 'state' || v.type == 'county' ||
              v.type == 'maritime'  || v.type == 'country') {
              z = 7;
            }
            omap.setView(new L.LatLng(parseFloat(v.lat), parseFloat(v.lon)), z);
          }
      }
  });
  return e.preventDefault();
}

$('#search .button').click(geolookup);
$('#search input[type=text]').keypress(function(e) {
  if (e.which == 13) geolookup();
});

// edit stuff courtesy of Martijn's remapatron: https://github.com/mvexel/remapatron/
function openIn(editor) {
  if (omap.getZoom() < 14) {
    alert("Please zoom in a little so we don\'t have to load a huge area from the API.");
    return false;
  }
  var bounds = omap.getBounds();
  var sw = bounds.getSouthWest();
  var ne = bounds.getNorthEast();
  if (editor == 'j') {
    var JOSMurl = "http://127.0.0.1:8111/load_and_zoom?left=" + sw.lng + "&right=" + ne.lng + "&top=" + ne.lat + "&bottom=" + sw.lat + "&new_layer=0";
    $.ajax({
      url: JOSMurl,
      complete: function(t) {
        if (t.status != 200) {
          alert("JOSM didn't respond, is it running?");
        } else {
          alert("Loaded area in JOSM...");
        }
      }
    });
  } else if (editor == 'p') {
    var PotlatchURL = "http://www.openstreetmap.org/edit?editor=potlatch2&bbox=" + omap.getBounds().toBBoxString();
    window.open(PotlatchURL);
    alert("Area opened in Potlatch...");
  }
}