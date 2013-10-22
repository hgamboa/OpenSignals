// VARIABLES
var ListColors = ["rgb(56,161,192)","rgb(140,185,80)","rgb(221, 177, 0)","rgb(238,117,52)","rgb(197, 26, 26)","rgb(134, 72, 134)"]
var ListColorsAn = ["red","#7EB900","#8500B9","#DB8C00","#82CA3F","brown"];
var limits = {"V":[0,3.3],"mV":[0,3300],"uS":[0,1055744],"lx":[0,66000],"G":[-5.5,5],"None":[0,1024]}
var data=[];
var a = [];
var dataOverview=[];
var choiceContainer;
var connection = false;
var xScale = 10
var Settings
var Devices
var play = true
var MaxOffset = [];
var MinOffset = [];
var macAddress
var ch = []
var units = []
var overview;
var CurrentDataset
var xmin = 48
var xmax = 60
var optionsMenuOpen = false
var digitalOut = [0,0,0,0]
var BeginApp = true
var samplingRate = 1000
var nSamples = 300
var acquisitionSet = false;
//******************************************************************************************

// MENU OPTIONS
$(function() {
	//Keyboard events
	$(document).keydown(function(e){
		if (!play) {
			if (e.keyCode == 37) {//left arrow pressed (38-up,40-down)
				ws.send('changeXScale("up")')
			} else if (e.keyCode == 39) { //right arrow pressed
				ws.send('changeXScale("down")')
			} else if (e.keyCode == 38) { //up arrow pressed
				changeYScale("up")
			} else if (e.keyCode == 40) { //down arrow pressed
				changeYScale("down")
			} else if (e.keyCode == 187) { // zoom in (+)
				Zooming("in")
			} else if (e.keyCode == 189) { //zoom out (-)
				Zooming("out")
			}
		}
	})
	// Click events
	$(document).click(function(e) {
		console.log(e.target.className)
		if (e.target.className == "headBox" && $("#tr"+e.target.id.slice(2)).attr('class') == 'graphic') {
			n = e.target.id.slice(-2,-1)
			console.log('Color: '+CurrentDataset[n].color)
			console.log("ID = #tr"+e.target.id.slice(2))
			$("#tr"+e.target.id.slice(2)).addClass('graphSelected')
			$("#tr"+e.target.id.slice(2)).css({'border-top':'1px solid '+CurrentDataset[n].color,'border-bottom':'1px solid '+CurrentDataset[n].color,'border-right':'1px solid '+CurrentDataset[n].color})
			$("#h3"+e.target.id.slice(2)).css({'color':CurrentDataset[n].color})
		} else if (e.target.className == "headBox" && $("#tr"+e.target.id.slice(2)).attr('class') == 'graphic graphSelected') {
			$("#tr"+e.target.id.slice(2)).removeClass('graphSelected')
			$("#tr"+e.target.id.slice(2)).css({'border-top':'1px solid #B1B1B1','border-bottom':'1px solid #B1B1B1','border-right':'1px solid #B1B1B1'})
			$("#h3"+e.target.id.slice(2)).css({'color':'#555'})
		
		} else if (e.target.id == "MainWelcome" && optionsMenuOpen == false) {
			$("#Loading").fadeOut(100);
			$("#WelcomePage").fadeOut(100)
			$("#MainWelcome").fadeOut(100)
		
		}else {
			$('tr[id]').removeClass('graphSelected')
			$('tr[id]').css({'border-top':'1px solid #B1B1B1','border-bottom':'1px solid #B1B1B1','border-right':'1px solid #B1B1B1'})
			$('h3[id]').css({'color':'#555'})
		}
	})
	$("#MenuLogo").click(function() {
		if (play == false) {
			acquisitionSet = false;
			$("#WelcomePage").fadeIn(100)
			$("#MainWelcome").fadeIn(100)
			$("#Loading").fadeIn(100);
			play = true
			$("#stopArrow").hide();
			ws.send('StopAcquisition()');
			ws.send('saveDigitalOutput('+JSON.stringify(digitalOut)+')');
		} else if(!acquisitionSet) {
			$("#WelcomePage").fadeIn(100)
			$("#MainWelcome").fadeIn(100)
			$("#Loading").fadeIn(100);
		}
	})
	
	$("#record").click(function() {
		if (connection) {
			acquisitionSet = true;
			play = true
			/*ws.send("getSettings()")*/
			$("#Loading").fadeOut(100)
			$("#WelcomePage").fadeOut(100)
			$("#MainWelcome").fadeOut(100)
			setTimeout(function() {
				$("#load").fadeIn(100)
				document.getElementById("ELAPSED").innerHTML = "00:00"
				if (samplingRate == 1000) {nSamples = 300}
				else if (samplingRate == 100) {nSamples = 12}
				else if (samplingRate == 10) {nSamples = 1}
				else if (samplingRate == 1) {nSamples = 1}
				ws.send('SetupAcquisition("'+macAddress+'",'+JSON.stringify(ch)+','+samplingRate+','+JSON.stringify(units)+')')
				
				AxisShow = false
			},500)
		}
	})
	
	$("#saveConfig").mouseover(function() {
		$(this).attr({src:'Img/new/certo_azul.png'});
	})
	$("#saveConfig").mouseout(function() {
		$(this).attr({src:'Img/new/certo_cinza.png'});
	})
	$("#saveConfig").click(function() {
		connection=false;
		macAddress = $("#MacAdd").attr('value')
        device = $("#Device").attr('value')
		mylist = document.getElementById('samplingRate')
		samplingRate = mylist.options[mylist.selectedIndex].text;
		//macAddress = Devices[device]//$("#MacAdd").attr('value')
		
        var checkbox = $("#contentConfig").parent().find("input[@type=checkbox]:checked");
        ch=[]
		labels = []
		units = []
		for (x=0;x<6;x++) {
			labels.push($("#A"+x+"t").attr('value'))
			units.push($("#unit"+x).val())
		}
        for (x=0;x<checkbox.length;x++) {
			ch.push(parseInt(checkbox[x].id.slice(-1)))
        }
		ws.send('saveConfig("'+device+'","'+macAddress+'",'+JSON.stringify(ch)+','+JSON.stringify(digitalOut)+','+JSON.stringify(labels)+','+JSON.stringify(units)+')')
		
	})
	$("#cancelConfig").mouseover(function() {
		$(this).attr({src:'Img/new/errado_azul.png'});
	})
	$("#cancelConfig").mouseout(function() {
		$(this).attr({src:'Img/new/errado_cinza.png'});
	})
	$("#cancelConfig").click(function() {
		$("#configurations").fadeOut(300)
		optionsMenuOpen = false
	})
	$("#help").click(function() {
		$("#BackHelp").fadeIn(500);
		optionsMenuOpen = true
	});
	$("#cancel2").click(function() {
		$("#BackHelp").fadeOut(500);
		optionsMenuOpen = false
	})
	$("#cancel2").mouseover(function() {
		$(this).attr({src:'Img/cancelFhover.png'});
	})
	$("#cancel2").mouseout(function() {
		$(this).attr({src:'Img/cancelF.png'});
	})
})

function ConnectionMade() {
	/*$("#boxToFlip").fadeIn(100);*/
	ws.send("getSettings()")
}


//------------------------------------------------
// BUILD PAGE FUNCTION
//------------------------------------------------
function BuildPage(datasets, overviewData) {
	var i = 0;
	dataOverview = []
    $.each(datasets, function(key, val) {
        val.color = ListColors[i];
        ++i;
    });
	var i = 0;
    $.each(overviewData, function(key, val) {
        val.color = ListColors[i];
        ++i;
    });
	
	CurrentDataset = datasets;
	choiceContainer = $("#boxOContent");
	choiceContainer.empty()
    $.each(datasets, function(key, val) {
        choiceContainer.append('<input type="checkbox" class="mycheckbox" name="' + key +'" checked="checked" id="id' + key + '">' +
								'<label for="id' + key + '" class="mycheckbox-label" style="background:'+val.color+' no-repeat left bottom;border:1px solid '+val.color+';">'+ 
								'</label><p style="margin:0;display:inline-block;margin-right:30px">'+val.label+'</p>');
    });
	
    choiceContainer.find("input").click(plotAccordingToChoices);
	
	for (var key in overviewData) {
		dataOverview.push(overviewData[key])
	}
	// $.plot($("#overview"), dataOverview, optOverview);
	
	// -----------------------------------
	// FUNCTION TO PLOT GRAPHICS ACCORDION TO OVERVIEW CHOICE
	// -----------------------------------
	function plotAccordingToChoices() {
		datasets = CurrentDataset;
		data = [];;
		choiceContainer.find("input:checked").each(function () {
			var key = $(this).attr("name");
			if (key && datasets[key])
				data.push(datasets[key]);
		});
		data.sort(function(a,b) {
				return a.id - b.id;
		});
		
		for (key in data) {
			$("label[for='id"+data[key].label.replace(/\s+/g, '')+"']").css({background:data[key].color,color:data[key].color});
		}
		choiceContainer.find("input:not(:checked)").each(function() {
			var key = $(this).attr("name");
			$("label[for='id"+key+"']").css({background:"whiteSmoke",color:"#A2A2A2"});
		});
		$("#containTable").empty();
		
		var H;
		if (data.length <=3) {
			H = Math.round(($("#containTable").height()-6-(7*data.length))/data.length);
		} else if (data.length == 4){
			H = Math.round(($("#containTable").height()-6-(7*data.length))/2);
			$("#containTable").append('<tr><td id="cell0"></td><td width="7px"></td><td id="cell1"></td></tr>'+
									'<tr><td id="cell2"></td><td width="7px"></td><td id="cell3"></td></tr>'
									)
		} else {
			H = Math.round(($("#containTable").height()-40)/3);
			$("#containTable").append('<tr><td id="cell0"></td><td width="7px"></td><td id="cell1"></td></tr>'+
									'<tr><td id="cell2"></td><td width="7px"></td><td id="cell3"></td></tr>'+
									'<tr><td id="cell4"></td><td width="7px"></td><td id="cell5"></td></tr>')
		}
		
		var k=0;
		for (var key in data) {
			if (data.length <=3) {
				$("#containTable").append('<tr id="tr'+data[key].id+key+'" class="graphic" style="border-left:5px solid '+data[key].color+'"><td valign="top" align="left" width="50px" >'+
										'<div id="box'+data[key].id+key+'" class="boxesIndividual" style="height:'+H+'px;">'+
										'<h3 id="h3'+data[key].id+key+'" class="headBox" style="width:'+H+'px;top:'+((H/2)-21)+'px;left:-'+((H/2)-21)+'px;">'+data[key].label+'</h3>'+
										//'<img id="plus'+data[key].label+'" src="Img/Plus.png" title="Add new annotation" onclick="addAnnotation('+key+');" onmouseover="ChangeImgSrc('+key+',true);" onmouseout="ChangeImgSrc('+key+',false);" width="15px" height="15px" style="position:relative;top:-32px;left:15px;z-index:9" />'+
										'<div id="content'+data[key].label.replace(/\s+/g, '')+'" class="contentBoxes" style="height:'+(H-1)+'px;">'+
										'<div id="boxContentTable'+data[key].label.replace(/\s+/g, '')+'" style="display:table-cell;vertical-align:middle;height:'+(H-1)+'px;padding-left:5px;overflow-y:auto;overflow-x:hidden;"></div></div>'+
										'</div>'+
										'</td>'+
										'<td align="right" valign="middle" width="'+($("#containTable").width()-90)+'px" style="padding-left:5px">'+
										'<div id="placeholderAnalog'+key+'" style="width:'+($("#containTable").width()-90)+'px;height:'+(H-40)+'px;"></div>'+					
										'</td><td align="center" valign="top" height="'+H+'"px width="20px" >'+
										'</td></tr><tr><td colspan="3" height="7px"></td></tr>');
				var d = [{data:data[key].data,color:data[key].color}];
				
				$.plot($("#placeholderAnalog"+key),d,options);
			} else  if (data.length == 4){
				$("#cell"+key).append('<tr id="tr'+data[key].label.id+key+'" class="graphic" style="border-left:5px solid '+data[key].color+'"><td valign="top" align="left" width="50px" >'+
										'<div id="box'+data[key].id+key+'" class="boxesIndividual" style="height:'+H+'px;">'+
										'<h3 id="h3'+data[key].id+key+'" class="headBox" style="width:'+H+'px;top:'+((H/2)-21)+'px;left:-'+((H/2)-21)+'px;">'+data[key].label+'</h3>'+
										//'<img id="plus'+data[key].label+'" src="Img/Plus.png" title="Add new annotation" onclick="addAnnotation('+key+');" onmouseover="ChangeImgSrc('+key+',true);" onmouseout="ChangeImgSrc('+key+',false);" width="15px" height="15px" style="position:relative;top:-32px;left:15px;z-index:9" />'+
										'<div id="content'+data[key].label.replace(/\s+/g, '')+'" class="contentBoxes" style="height:'+(H-1)+'px;">'+
										'<div id="boxContentTable'+data[key].label.replace(/\s+/g, '')+'" style="display:table-cell;vertical-align:middle;height:'+(H-1)+'px;padding-left:5px;overflow-y:auto;overflow-x:hidden;"></div></div>'+
										'</div>'+
										'</td>'+
										'<td align="right" height="'+H+'"px valign="middle" style="padding-left:5px">'+
										'<div id="placeholderAnalog'+key+'" style="width:'+(($("#containTable").width()/2)-80)+'px;height:'+(H-40)+'px;"></div>'+					
										'</td><td align="center" valign="top" height="'+H+'"px width="10px" >'+
										'</td></tr><tr><td colspan="3" height="7px"></td></tr>');
				var d = [{data:data[key].data,color:data[key].color}];
				$.plot($("#placeholderAnalog"+key),d,options);
			} else if (data.length >4) {
				$("#cell"+key).append('<tr id="tr'+data[key].id+key+'" class="graphic" style="border-left:5px solid '+data[key].color+'"><td valign="top" align="left" width="50px" >'+
										'<div id="box'+data[key].id+key+'" class="boxesIndividual" style="height:'+H+'px;">'+
										'<h3 id="h3'+data[key].id+key+'" class="headBox" style="width:'+H+'px;top:'+((H/2)-21)+'px;left:-'+((H/2)-21)+'px;">'+data[key].label+'</h3>'+
										//'<img id="plus'+data[key].label.replace(/\s+/g, '')+'" src="Img/Plus.png" title="Add new annotation" onclick="addAnnotation('+key+');" onmouseover="ChangeImgSrc('+key+',true);" onmouseout="ChangeImgSrc('+key+',false);" width="15px" height="15px" style="position:relative;top:-32px;left:15px;z-index:9" />'+
										'<div id="content'+data[key].label.replace(/\s+/g, '')+'" class="contentBoxes" style="height:'+(H-1)+'px;">'+
										'<div id="boxContentTable'+data[key].label.replace(/\s+/g, '')+'" style="display:table-cell;vertical-align:middle;height:'+(H-1)+'px;padding-left:5px;overflow-y:auto;overflow-x:hidden;"></div></div>'+
										'</div>'+
										'</td>'+
										'<td align="right" height="'+H+'"px valign="middle" style="padding-left:5px">'+
										'<div id="placeholderAnalog'+key+'" style="width:'+(($("#containTable").width()/2)-80)+'px;height:'+(H-40)+'px;"></div>'+					
										'</td><td align="center" valign="top" height="'+H+'"px width="10px" >'+
										'</td></tr><tr><td colspan="3" height="7px"></td></tr>');
				var d = [{data:data[key].data,color:data[key].color}];
				$.plot($("#placeholderAnalog"+key),d,options);
			}
			MaxOffset[key] = limits[units[data[key].id]][1];
			MinOffset[key] = limits[units[data[key].id]][0];
		}
		overviewPlot = $.plot($("#overview"),d,optOverview)

		/*$("#Loading").fadeOut(500);*/
	}
    plotAccordingToChoices();
	connection = true;
	
	
}

// FUNCTION TO ROUND NUMBERS TO FLOAT
function round_float(x,n){
  if(!parseInt(n))
  	var n=0;
  if(!parseFloat(x))
  	return false;
  return Math.round(x*Math.pow(10,n))/Math.pow(10,n);
}

// FILE EXPLORER
function DisplayFiles(directories) {
	/*$("#PageTitle").css({'z-index':'0'})
	$("#boxToFlip").flippy({
		direction:"LEFT",
		duration:'1000',
		onFinish:function(){
			$("#FileExplorer").show();
		}
	});*/
	$("#FileExplorer").fadeIn(200);
	$("#pathName").attr('value',directories.path);
	var dirFiles = directories.dir;
	var filesList = directories.files;
	var ConstructFiles = '<div id = "content"><ul id="selectable" style = "list-style-type:none; text-align:left;margin-top:5px;padding-left:5px;"><p id = "back" style="padding:3px;font-style:normal;color:black;font-size:14px;margin:5px">..</p>';
	for (var i in dirFiles) {
		ConstructFiles += '<p id = "'+dirFiles[i]+'folder" class = "folder">'+dirFiles[i]+'</p>'
	}
	for (var i in filesList) {
		ConstructFiles += '<p id = "'+filesList[i]+'file" class = "file">'+filesList[i]+'</p>'
	}
	ConstructFiles +='</ul></div>'
	$("#FilesandFolders").append(ConstructFiles)
	$( "#FilesandFolders p" ).mouseover(function() {
			if (document.getElementById($(this).attr('id')).className == "folder") {
				$(this).addClass("fileHighlight");
			} else {
				$(this).addClass("fileHighlightBack");
			}
	});
	$( "#FilesandFolders p" ).mouseout(function() {
			if (document.getElementById($(this).attr('id')).className == "folder fileHighlight") {
				$(this).removeClass("fileHighlight");
			} else {
				$(this).removeClass("fileHighlightBack");
			}
	});
	$( ".folder" ).dblclick(function() {
		var dirID = $(this).attr('id');
		var path = $("#pathName").attr('value');
		path = path.replace(/\\/g,"\\\\");
		var dir = document.getElementById(dirID).innerHTML;
		ws.send('getFile(os.path.abspath("'+path+'\\\\'+dir+'"),False)')
		$("#FilesandFolders").empty();
		
	})
	$(".file").dblclick(function() {
	
	})
	$("#back").dblclick(function() {
		var path = $("#pathName").attr('value');
		path = path.replace(/\\/g,"\\\\");
		ws.send('getFile(os.path.abspath("'+path+'"),True)')
		$("#FilesandFolders").empty();
	})
	
	$("#cancel").click(function() {
		$("#popMessage").hide();
		$("#FileExplorer").fadeOut(500);
		optionsMenuOpen = false
	});
}
$(function() {
	/*$("#playOf").hover(function() {
		$("#colorCircle").css({'display':'block'});
		console.log('enter mouse')
	}, function(){
		$("#colorCircle").css({'display':'none'});
		console.log('leave mouse')
	}
	
	)
	
	$("#record").mouseenter(function() {
		$("#colorCircleSmall").css({'display':'block'});
	})
	$("#record").mouseleave(function() {
		$("#colorCircleSmall").css({'display':'none'});
	})*/
	
	
	
	$("#save").mouseover(function() {
		$(this).attr({src:'Img/new/save_azul.png'});
	})
	$("#save").mouseout(function() {
		$(this).attr({src:'Img/new/save_1.png'});
	})
	$("#save").click(function() {
		if (BeginApp == false) {SendDir()}
		else{ alert("You can only save after doing a record!")}
	})
	$("#BackDevices").mouseover(function() {
		$(this).attr({src:'Img/backFhover.png'});
	})
	$("#BackDevices").mouseout(function() {
		$(this).attr({src:'Img/backF.png'});
	})
	
	$("#helpFileExp").mouseover(function() {
		$(this).attr({src:'Img/new/help_pequeno_azul.png'});
	})
	$("#helpFileExp").mouseout(function() {
		$(this).attr({src:'Img/new/help_pequeno_cinza.png'});
	})
	$("#helpFileExp").click(function() {
		// implementar help do file explorer
	})
	/*$("#search").mouseover(function() {
		$(this).attr({src:'Img/new/search_azul.png'});
	})
	$("#search").mouseout(function() {
		$(this).attr({src:'Img/new/search_cinza.png'});
	})
	$("#openFile").mouseover(function() {
		$(this).attr({src:'Img/new/open_azul.png'});
	})
	$("#openFile").mouseout(function() {
		$(this).attr({src:'Img/new/open_cinza.png'});
	})
	*/
	$("#config").mouseover(function() {
		$(this).attr({src:'Img/new/config_azul.png'});
	})
	$("#config").mouseout(function() {
		$(this).attr({src:'Img/new/settings_1.png'});
	})
	/*
	$("#help").mouseover(function() {
		$(this).attr({src:'Img/new/help_azul.png'});
	})
	$("#help").mouseout(function() {
		$(this).attr({src:'Img/new/help_cinza.png'});
	})*/
	
	$("#ConfirmCheck").mouseover(function() {
		$(this).attr({src:'Img/new/certo_azul.png'});
	})
	$("#ConfirmCheck").mouseout(function() {
		$(this).attr({src:'Img/new/certo_cinza.png'});
	})
	
	$("#cancel").mouseover(function() {
		$(this).attr({src:'Img/new/errado_azul.png'});
	})
	$("#cancel").mouseout(function() {
		$(this).attr({src:'Img/new/errado_cinza.png'});
	})
	
	$("#exitImage").mouseover(function() {
		$(this).attr({src:'Img/new/off.png'});
	})
	$("#exitImage").mouseout(function() {
		$(this).attr({src:'Img/new/on.png'});
	})
	
	$("#goBack").mouseover(function() {
		$(this).attr({src:'Img/backFhover.png'});
	})
	$("#goBack").mouseout(function() {
		$(this).attr({src:'Img/backF.png'});
	})
	$("#ConfirmCheck").click(function() {
		if ($("#fileName").attr('value') == "") {
			$("#popMessage").show();
		}else {
			
			var path = $('#pathName').attr('value');
			path = path.replace(/\\/g,"\\\\");
			var file = $('#fileName').attr('value');
			type=$("#fileFormat").find(":selected")[0].id
			ws.send("checkFile('"+path+"','"+file+"','"+type+"')");
		}
	})
})

function FileExists(check) {
	if (check) {
		var r=confirm("There is already a file with the same name in this location!\n Do you want to replace it?");
		if (r==true) {
			var path = $('#pathName').attr('value');
			path = path.replace(/\\/g,"\\\\");
			var file = $('#fileName').attr('value');
			type=$("#fileFormat").find(":selected")[0].id
			ws.send("saveFile('"+path+"','"+file+"','"+type+"')");
			$("#popMessageSaving").show();
			$("#FileExplorer").fadeOut(200);
			optionsMenuOpen = false
			$("#popMessage").hide();
		}
	} else {
		var path = $('#pathName').attr('value');
		path = path.replace(/\\/g,"\\\\");
		var file = $('#fileName').attr('value');
		type=$("#fileFormat").find(":selected")[0].id
		ws.send("saveFile('"+path+"','"+file+"','"+type+"')");
		$("#popMessageSaving").show();
		$("#FileExplorer").fadeOut(200);
		optionsMenuOpen = false
		$("#popMessage").hide();
	}

}
function FileSaved() {
	$("#popMessageSaving").hide();
}
function SendDir() {
	optionsMenuOpen = true
	$("#FilesandFolders").empty();
	$("#boxToFlip").show()
	ws.send('getFile(os.getcwd(),False)');
}


function ReceiveData(DataArray) {
	console.log(DataArray)
}

function printMessage(str) {
	console.log(str)
}

function Connect(state) {
	if (state == true) { //Successful connection to device
		ws.send('StartAcquisition()')
		AxisShow = true
		AcqShoworHide = true;
		
	} else { //No connected to device
		if (macAddress == '') { alert('Select a device in the configurations'); } else{
		alert("Connection failed! \nCheck if your device or Bluetooth receiver are connected.") }
		$("#WelcomePage").fadeIn(100);
		$("#MainWelcome").fadeIn(100);$("#Loading").fadeIn(100); 
		$("#load").fadeOut(100)
		play = true
		acquisitionSet = false;
	}
}

function configurations() {
	optionsMenuOpen = true
	$("#configurations").fadeIn(300)
}

function TryNewSetup() {
	/*ws.send('SetupAcquisition("'+macAddress+'",'+JSON.stringify(ch)+')')*/
}

function changeCheckboxStyle(id) {
	if ($("#"+id).is(':checked')) {
		$("label[for='"+id+"']").css({"background":"#71a9ab","border-color":"#71a9ab"})
	} else {
		$("label[for='"+id+"']").css({"background":"transparent","border-color":"grey"})
	}
}

function SetConfigurations(sets,dev) {
	Settings = sets
	Devices = dev
	macAddress = Settings.MacAddress
	$("#MacAdd").attr('value',macAddress)
	$("#Device").attr('value',Settings.Device)
	$("#devices").empty()
	/*for (key in Devices) {
		$("#devices").append('<option value="'+key+'"></option>')
	}*/
	for (x=0;x<6;x++) {$("#A"+x+"t").attr('value',Settings.Labels[x]);$("#unit"+x).val(Settings.Units[x]);}
    $("#contentConfig").parent().find('input[type=checkbox]:checked').removeAttr('checked');
        
    for (an in Settings.Analog) {
        $('#A'+Settings.Analog[an]).attr('checked','checked');
        changeCheckboxStyle("A"+Settings.Analog[an])
    }
	var checkbox = $("#contentConfig").parent().find("input[@type=checkbox]:checked");
	dt = {}
	ch=[]
	for (x=0;x<checkbox.length;x++) {
		id = checkbox[x].id +"t"
		name = Settings.Labels[parseInt(checkbox[x].id.slice(-1))]
		if (Settings.Units[parseInt(checkbox[x].id.slice(-1))] == "None") {
			dt[parseInt(checkbox[x].id.slice(-1))] = {"id":parseInt(checkbox[x].id.slice(-1)),"label": name,"data":[],"anot":[]}
		} else {
			dt[parseInt(checkbox[x].id.slice(-1))] = {"id":parseInt(checkbox[x].id.slice(-1)),"label": name+" ["+Settings.Units[parseInt(checkbox[x].id.slice(-1))]+"]","data":[],"anot":[]}
		}
		ch.push(parseInt(checkbox[x].id.slice(-1)))
		
	}
	units = Settings.Units
	ws.send('getRTDatatoFlot('+JSON.stringify(dt)+')')
	$("#configurations").fadeOut(300)
	optionsMenuOpen = false
	digitalOut = Settings.Digital
	for (d in digitalOut) {
		if (digitalOut[3-d] == 0) {
			$("#DO"+d).attr("src","Img/new/botao.png")
		} else {
			$("#DO"+d).attr("src","Img/new/botao_azul.png")
		}
	}
	$("#MenuLogo").fadeIn(500);
	$("#boxToFlip").fadeIn(500);
	
}

function DeviceSelect() {
	option = $("#Device").attr('value')
	console.log('Device Select')
	macAddress = Devices[option]
    //$("#MacAdd").attr('value',Devices[option])
}

function changeYScale(UpOrDown) {
	trSelected=$(".graphSelected")
	// OffsetJump = 10
	
	if (trSelected.length > 0) { //there is a plot selected
		if (UpOrDown == 'up') {
			for (tr=0;tr<trSelected.length;tr++) {
				keyLabel = trSelected[tr].id.slice(-1)
				MaxOffset[keyLabel]+=(limits[units[data[keyLabel].id]][1]-limits[units[data[keyLabel].id]][0])*0.05
				MinOffset[keyLabel]+=(limits[units[data[keyLabel].id]][1]-limits[units[data[keyLabel].id]][0])*0.05
			}
		} else if (UpOrDown == 'down') {
			for (tr=0;tr<trSelected.length;tr++) {
				keyLabel = trSelected[tr].id.slice(-1)
				MaxOffset[keyLabel]-=(limits[units[data[keyLabel].id]][1]-limits[units[data[keyLabel].id]][0])*0.05
				MinOffset[keyLabel]-=(limits[units[data[keyLabel].id]][1]-limits[units[data[keyLabel].id]][0])*0.05
			}
		}
	} else { // apply changing to all plots
		if (UpOrDown == 'up') {
			for (var i in dataGeral) {
				if (i.indexOf('Analog') != -1) {
				MaxOffset[i.slice(-1)]+=(limits[units[data[i.slice(-1)].id]][1]-limits[units[data[i.slice(-1)].id]][0])*0.05;
				MinOffset[i.slice(-1)]+=(limits[units[data[i.slice(-1)].id]][1]-limits[units[data[i.slice(-1)].id]][0])*0.05;
				}
			}
			
		} else if (UpOrDown == 'down') {
			for (var i in dataGeral) {
				if (i.indexOf('Analog') != -1) {
				MaxOffset[i.slice(-1)]-=(limits[units[data[i.slice(-1)].id]][1]-limits[units[data[i.slice(-1)].id]][0])*0.05;
				MinOffset[i.slice(-1)]-=(limits[units[data[i.slice(-1)].id]][1]-limits[units[data[i.slice(-1)].id]][0])*0.05;
				}
			}
		}
	}
}

function Zooming(InOrOut) {
	trSelected=$(".graphSelected")
	// ZoomJump = 10
	if (trSelected.length > 0) { //there is a plot selected
		if (InOrOut == 'in') { // (+)
			for (tr=0;tr<trSelected.length;tr++) {
				keyLabel = trSelected[tr].id.slice(-1)
				MaxOffset[keyLabel]-=(limits[units[data[keyLabel].id]][1]-limits[units[data[keyLabel].id]][0])*0.05
				MinOffset[keyLabel]+=(limits[units[data[keyLabel].id]][1]-limits[units[data[keyLabel].id]][0])*0.05
			}
		} else if (InOrOut == 'out') { // (-)
			for (tr=0;tr<trSelected.length;tr++) {
				keyLabel = trSelected[tr].id.slice(-1)
				MaxOffset[keyLabel]+=(limits[units[data[keyLabel].id]][1]-limits[units[data[keyLabel].id]][0])*0.05
				MinOffset[keyLabel]-=(limits[units[data[keyLabel].id]][1]-limits[units[data[keyLabel].id]][0])*0.05
			}
		}
	} else { // apply zooming to all plots
		if (InOrOut == 'in') { // (+)
			for (var i in dataGeral) {
				if (i.indexOf('Analog') != -1) {
				MaxOffset[i.slice(-1)]-=(limits[units[data[i.slice(-1)].id]][1]-limits[units[data[i.slice(-1)].id]][0])*0.05;
				MinOffset[i.slice(-1)]+=(limits[units[data[i.slice(-1)].id]][1]-limits[units[data[i.slice(-1)].id]][0])*0.05;
				}
			}
			
		} else if (InOrOut == 'out') { // (-)
			for (var i in dataGeral) {
				if (i.indexOf('Analog') != -1) {
				MaxOffset[i.slice(-1)]+=(limits[units[data[i.slice(-1)].id]][1]-limits[units[data[i.slice(-1)].id]][0])*0.05;
				MinOffset[i.slice(-1)]-=(limits[units[data[i.slice(-1)].id]][1]-limits[units[data[i.slice(-1)].id]][0])*0.05;
				}
			}
		}
	}
}

var seconds = null;
var ticker = null;

function startTimer()
{
	seconds = -1;
	ticker = setInterval("tick( )", 1000);
	tick();
}
function stopTimer()
{
	clearInterval(ticker)
}
function tick(seconds)
{
	// ++seconds;
	var secs = seconds;
	var hrs = Math.floor( secs / 3600 );
	secs %= 3600;
	var mns = Math.floor( secs / 60 );
	secs %= 60;
	var Time = ( hrs < 10 ? "0" : "" ) + hrs
				 + ":" + ( mns < 10 ? "0" : "" ) + mns
				 //+ ":" + ( secs < 10 ? "0" : "" ) + secs;
	//var Time = ( mns < 10 ? "0" : "" ) + mns
				+ ":" + ( secs < 10 ? "0" : "" ) + Math.floor(secs);
    document.getElementById("ELAPSED").innerHTML = Time;
}

function NewXScale(scale) {
	xmin = 60-scale
	/*overviewPlot.setSelection({xaxis:{from:xmin,to:xmax}},true);*/
	document.getElementById("timeScale").innerHTML = scale+"s"
}

function digitalOutputs (n) {
	if ($("#DO"+n).attr('src') =='Img/new/botao_azul.png') {
		digitalOut[3-n] = 0
		$("#DO"+n).attr('src','Img/new/botao.png')
	} else {
		digitalOut[3-n] = 1
		$("#DO"+n).attr('src','Img/new/botao_azul.png')
	}
	// console.log(JSON.stringify(digitalFinal))
	ws.send("digitalOutputs("+JSON.stringify(digitalOut)+")")
}

function exit() {
	ws.close()
	window.open("", "_self", "");
	window.close();
}

function DevicesPage() {
	$("#BackDevices").hide();
    // $("#contentConfig").addClass('animated flipInY') 
	$("#configurations").hide()
	$("#configurationsDevices").show()
	$("#oldDevices").empty()
	for (var d in Devices) {
		$("#oldDevices").append('<tr><td><h4 id="'+Devices[d][0]+'" style="font-family:arial;margin:5px;text-align:left">'+Devices[d][1]+'</h4><p style="font-size:12px;font-family:arial;margin:5px;text-align:left">'+Devices[d][0]+'</p></td></tr>')
	}
	ws.send('search()')
	$("#SearchNewDevices").text('Searching...')
	$('#loadDevices').show();
	$("#oldDevices h4").click(function(e) {
		$("#newDevices").empty()
		$("#oldDevices").empty()
		macAddress = e.srcElement.id
		$("#MacAdd").attr('value',macAddress)
		$("#Device").attr('value',e.srcElement.innerText)
		$("#configurationsDevices").hide()
		$("#configurations").show()
		
	})
	
}
//ws.send('search()')
var TESTE
function SearchDevices(Dev) {
	$("#newDevices").empty()
	$("#loadDevices").hide()
	TESTE = Dev
	if (Dev['new'].length == 0) {
		$("#newDevices").append('<p style="font-size:12px;font-family:arial;margin:5px;text-align:left">No new devices found.</p>')
	} else {
		//$("#SearchNewDevices").text('Search new devices...')
		for (var d in Dev['new']) {
			name = Dev['new'][d][1]
			if (name == '') {name='Unknow'}
			$("#newDevices").append('<tr><td><h4 id="'+Dev['new'][d][0]+'" style="font-family:arial;margin:5px;text-align:left">'+name+'</h4><p style="font-size:12px;font-family:arial;margin:5px;text-align:left">'+Dev['new'][d][0]+'</p></td></tr>')
		}
	}
	// $(".overlay").hide()
	$("#SearchNewDevices").text('Search new devices')
	$("#newDevices h4").click(function(e) {
		$("#newDevices").empty()
		$("#oldDevices").empty()
		macAddress = e.srcElement.id
		$("#MacAdd").attr('value',macAddress)
		$("#Device").attr('value',e.srcElement.innerText)
		$("#configurationsDevices").hide()
		$("#configurations").show()
	})
	$("#BackDevices").show();
}