




var wave1amp =0;
var wave2amp =0;
var wave1phase =0;
var wave2phase=0;

$(function(){
  
  gPolar3d = new Polarize3d($('#viewport'));
  $('#run_checkbox').change(doTimer);
  $(".ampslider").slider({
    min: 0,
    max: 200,
    step: 1,
    value: 100,
    slide:ChangeSliders
  });

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


function ChangeSliders()
{
  gPolar3d.gSetupDirty = true;
  wave1amp = $('#wave1amp').slider("value");
  wave2amp = $('#wave2amp').slider("value");
  $('#wave1amp_disp').text(wave1amp.toFixed(0));
  $('#wave2amp_disp').text(wave2amp.toFixed(0));
  wave1phase = $('#wave1phase').slider("value")*Math.PI/180;
  wave2phase = $('#wave2phase').slider("value")*Math.PI/180;
  $('#wave1phase_disp').text((wave1phase*180/Math.PI).toFixed(0));
  $('#wave2phase_disp').text((wave2phase*180/Math.PI).toFixed(0));

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
    // for(var ip=0;ip<polarizers.length;ip++) {
    //   this.AddPolarizer(polarizers[ip].z, polarizers[ip].angle);
    // }
    
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
  this.AddLinearWave(wave1amp,wavelength,wave1phase+phase,0,        -500,500,false,true,false,"blue");
  this.AddLinearWave(wave2amp,wavelength,wave2phase+phase,Math.PI/2,-500,500,false,true,false,"green");
  this.AddEllipticalWave(wavelength,wave1amp,wave2amp,wave1phase+phase,wave2phase+phase,-500,500,"black");
  this.Draw();
}

function NormalizeVector(v)
{
  var  dd = (v.x*v.x + v.y*v.y + v.z*v.z);
  if(dd<=0) return;
  var d = Math.sqrt(dd);
  v.x /= d;
  v.y /= d;
  v.z /= d;
}

Polarize3d.prototype.AddArrow = function(x,y,z,x2,y2,z2,head_size,width,color,obj)
{
  var n = {x: x2-x, y: y2-y, z: z2-z};
  NormalizeVector(n);
  this.AddLine(x,y,z,x2,y2,z2,width,color,obj);
  // Vector direction

  // find a perpendicular vector. This is a cheat.
  // var u = {x: n.y, y:n.x, z:0};
  // NormalizeVector(u);
  // var v = {x: (n.y*u.z - n.z*u.y),
  //          y: (n.z*u.x - n.x*u.z),
  //          z: (n.x*u.y - n.y*u.x)
  // };
  // NormalizeVector(v);
  var v = {x:0, y:0, z:1};
  
  
  // this.AddLine(x2,y2,z2,
  //             x2 - n.x*head_size + u.x*head_size,
  //             y2 - n.y*head_size + u.y*head_size,
  //             z2 - n.z*head_size + u.z*head_size,
  //             width, color, obj);
  // this.AddLine(x2,y2,z2,
  //             x2 - n.x*head_size - u.x*head_size,
  //             y2 - n.y*head_size - u.y*head_size,
  //             z2 - n.z*head_size - u.z*head_size,
  //             width, color, obj);
  this.AddLine(x2,y2,z2,
              x2 - 2*n.x*head_size + v.x*head_size,
              y2 - 2*n.y*head_size + v.y*head_size,
              z2 - 2*n.z*head_size + v.z*head_size,
              width, color, obj);
  this.AddLine(x2,y2,z2,
              x2 - 2*n.x*head_size - v.x*head_size,
              y2 - 2*n.y*head_size - v.y*head_size,
              z2 - 2*n.z*head_size - v.z*head_size,
              width, color, obj);
    

}


Polarize3d.prototype.AddLinearWave = function(amp,wavelength,phase,polarization,from_z,to_z,show_line,show_vectors,show_bfield,color)
{
  // console.log(wavelength,phase,polarization,from_z,to_z);
  var n = 0;
  var Ex_last;
  var Ey_last;
  var Bx_last;
  var By_last;
  var z_last;
  var i = 0;
  
  this.AddLine(0,0,from_z,0,0,to_z,1,'black',null);
  
  for(var z=from_z; z<=to_z; z+=5) {
    var E = amp*Math.sin(phase - twopi*z/wavelength );    
    var Ex = Math.cos(polarization)*E;
    var Ey = Math.sin(polarization)*E;

    var Bx = Math.cos(polarization+twopi/4)*E;
    var By = Math.sin(polarization+twopi/4)*E;
    // console.debug(E,Ex,Ey);
    if(n>0 && show_line) {
      this.AddLine(Ex_last,Ey_last,z_last,Ex,Ey,z,2,color,null);
      if(show_bfield )this.AddLine(Bx_last,By_last,z_last,Bx,By,z,2,'red',null);                       
      
    } else n++;  
    if(show_vectors && (i%4==0)) {
      this.AddArrow(0,0,z,Ex,Ey,z,Math.abs(amp*0.05),1,color,null);
      if(show_bfield )
        this.AddArrow(0,0,z,Bx,By,z,Math.abs(amp*0.05),1,'red',null);
    }  
    Ex_last = Ex;
    Ey_last = Ey;
    Bx_last = Bx;
    By_last = By;
    z_last  = z;
    i++;
  }
}

Polarize3d.prototype.AddEllipticalWave = function(wavelength,amp1,amp2,phase1,phase2,from_z,to_z,color)
{
 // console.log(wavelength,phase,polarization,from_z,to_z);
  var n = 0;
  var Ex_last;
  var Ey_last;
  var z_last;
  var i = 0;
  var show_vectors=true;
  
  this.AddLine(0,0,from_z,0,0,to_z,1,'black',null);
  
  var Emag = Math.sqrt(amp1*amp1+amp2*amp2);
  for(var z=from_z; z<=to_z; z+=5) {
    var E1 = amp1*Math.sin(phase1 - twopi*z/wavelength );  
    var E2 = amp2*Math.sin(phase2 - twopi*z/wavelength );  
    
    var Ex = E1;
    var Ey = E2;

    if(n>0) {
      this.AddLine(Ex_last,Ey_last,z_last,Ex,Ey,z,2,color,null);
    } else n++;  
    if(show_vectors && (i%4==0)) {
      this.AddArrow(0,0,z,Ex,Ey,z,Math.abs(Emag*0.05),1,color,null);
    }  
    Ex_last = Ex;
    Ey_last = Ey;
    z_last  = z;
    i++;
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



