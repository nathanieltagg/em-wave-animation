




$(function(){
  
  gPolar3d = new Polarize3d($('#viewport'));
  $('#run_checkbox').change(doTimer);
  
  $(".polslider").slider({
    min: 0,
    max: 360,
    step: 1,
    value: 90,
    slide:ChangeSliders
  });
  
  $(".polbox").change(ChangeSliders);
  ChangeSliders();

  doTimer();
});

var gTimer;
var gTimerOn = true;
var gLastTimerTime = 0;
function doTimer()
{
  if($('#run_checkbox').is(':checked')) {
    gPolar3d.Rebuild();
    gTimer = setTimeout("doTimer()",100);
    var d = new Date();
    var t= d.getTime();
    // $('#fps').html(1000.0/(t-gLastTimerTime))
    gLastTimerTime = t;
  } else {
    if(gTimer) clearTimeout(gTimer);
  }
}

var polarizers=[
  {z: -200, angle: 0},
  {z:000 , angle: 1.2},
  {z:200 , angle: 1.2}
  ];

var polarizer_positions = [-200,0,200];

function ChangeSliders()
{
  gPolar3d.gSetupDirty = true;
  polarizers = []
  var sliders = $(".polslider").each(function(){
    var v = $(this).slider('value');
    var p = this.getAttribute('myPol');
    var angle = v/180*Math.PI;
    if($('input[myPol='+p+']').is(':checked')) polarizers.push({z:polarizer_positions[p],angle:angle});    
  });
  console.log(polarizers);
}


// Subclass of Pad3d.
Polarize3d.prototype = new Pad3d;           
Polarize3d.prototype.constructor = Polarize3d;

function Polarize3d( element, options ){
  // console.log('TriDView ctor');
  if(!element) {
    // console.log("TriDView: NULL element supplied.");
    return;
  }
  if($(element).length<1) { 
    // console.log()
    return;   
  }
  
  var settings = {
    default_look_at:    [0,0,0],
    default_camera_distance: 800,
    camera_distance_max: 8000,
    camera_distance_min: 50,
    default_theta: -0.1,
    default_phi: 0.5,
  }
  $.extend(true,settings,options);  // Change default settings by provided qualities.
  Pad3d.call(this, element, settings); // Give settings to Pad contructor.
  this.ResetView();
  this.gSetupDirty = true;
  
}

var twopi = 2*Math.PI;


Polarize3d.prototype.Rebuild = function()
{
  if(this.gSetupDirty) {
    // Draw the scenery elements.
    this.objects = [];
    for(var ip=0;ip<polarizers.length;ip++) {
      this.AddPolarizer(polarizers[ip].z, polarizers[ip].angle);
    }
    
    this.scenery_objects = this.objects.slice(0); // make a copy
  } else {
    this.objects = this.scenery_objects.slice(0); // copy back.
  }

  var d = new Date();
  var t = d.getTime();

  // Draw polarizers into base
  
  var wavelength = 100;
  var period = 5000; // ms
  var phase = twopi*((t/period)%1.0);
  var amp = 100;

  // this.AddCircularWave(wavelength,phase,1.0,-500,polarizers[0].z);
   this.AddLinearWave(amp,wavelength,phase,0,-500,polarizers[0].z);
   this.AddLinearWave(amp,wavelength,phase,Math.PI/2,-500,polarizers[0].z);
   for(var ip=1;ip<polarizers.length;ip++) {
     this.AddLinearWave(amp,wavelength,phase,polarizers[ip-1].angle,polarizers[ip-1].z,polarizers[ip].z);
     var ca =  Math.cos(polarizers[ip].angle - polarizers[ip-1].angle);
     amp = amp*ca*ca;
   }
   
  var ip = polarizers.length -1;
  this.AddLinearWave(amp,wavelength,phase,polarizers[ip].angle,polarizers[ip].z,500);
   
  // this.CreateFrame();
  // if ($('#ctl-show-hitmap-tracks').is(':checked')) {  this.CreateTracks(); }
  // if ($('#ctl-show-hitmap-hits').is(':checked')) {  this.CreateStrips(); }
  // if ($('#ctl-show-hitmap-vertices').is(':checked')) { this.CreateVertices(); }
  // console.log("built ",this.objects.length," objects");
  this.Draw();
}

Polarize3d.prototype.AddLinearWave = function(amp,wavelength,phase,polarization,from_z,to_z)
{
  // console.log(wavelength,phase,polarization,from_z,to_z);
  var n = 0;
  var Ex_last;
  var Ey_last;
  var z_last;
  for(var z=from_z; z<=to_z; z+=10) {
    var E = amp*Math.sin(phase - twopi*z/wavelength );    
    var Ex = Math.cos(polarization)*E;
    var Ey = Math.sin(polarization)*E;
    // console.debug(E,Ex,Ey);
    if(n>0) {
      this.AddLine(Ex_last,Ey_last,z_last,Ex,Ey,z,1,'black',null);
    } else n++;
    Ex_last = Ex;
    Ey_last = Ey;
    z_last  = z;
  }
}

Polarize3d.prototype.AddCircularWave = function(wavelength,phase,polarization,from_z,to_z)
{
  var n = 0;
  var Ex_last;
  var Ey_last;
  var z_last;
  for(var z=from_z; z<=to_z; z+=5) {
    var E = 100;    
    var Ex = Math.cos(polarization*(phase - twopi*z/wavelength))*E;
    var Ey = Math.sin(polarization*(phase - twopi*z/wavelength))*E;
    if(n>0) {
      this.AddLine(Ex_last,Ey_last,z_last,Ex,Ey,z,1,'black',null);
    } else n++;
    Ex_last = Ex;
    Ey_last = Ey;
    z_last  = z;
  }
}

Polarize3d.prototype.AddPolarizer = function(z,angle)
{
 this.AddCircle(z,200); 
 // this.AddCircle(z+10,200); 
 var hw = 150; // halfwidth
 var hh = 15; // halfheight
 var p=[
   {x: -hw, y:-hh},
   {x:  hw, y:-hh},
   {x:  hw, y: hh},
   {x: -hw, y: hh},
   {x: -hw, y:-hh},
   ];
 for(var i=0;i<4;i++) {
   var j = i+1;
   this.AddLine(Math.cos(angle)*p[i].x - Math.sin(angle)*p[i].y,  Math.sin(angle)*p[i].x + Math.cos(angle)*p[i].y  , z,
                Math.cos(angle)*p[j].x - Math.sin(angle)*p[j].y,  Math.sin(angle)*p[j].x + Math.cos(angle)*p[j].y  , z,
                1,'blue',null);     
 }
 
}

Polarize3d.prototype.AddCircle = function(z,r)
{
  var nsteps = 18;
  var dtheta = Math.PI*2/(nsteps);  
  for(var i=0;i<nsteps;i++) {
    var x1 = r * Math.cos(i*dtheta);
    var x2 = r * Math.cos((i+1)*dtheta);
    var y1 = r * Math.sin(i*dtheta);
    var y2 = r * Math.sin((i+1)*dtheta);
    this.AddLine(   x1, y1, z,  x2, y2, z, 2, "blue"); 
  }
}



