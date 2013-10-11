import shutil
import numpy
import h5py
import h5db
import json
import inspect
import time
import socket
import os
import os.path
import BITalino
import multiprocessing
import traceback
import datetime
import copy
from txws import WebSocketFactory
from twisted.internet import protocol, reactor
global id
global CPTH
global INSDIR
global dataset

CPTH=None
id=0


class VS(protocol.Protocol):
	def connectionMade(self):
		self.transport.write('ConnectionMade()')

	def send(self,data,prot):
		prot.transport.write(data)
		
	def dataReceived(self, data):
		print "Server received: %s"%data
		try:
			if "StartAcquisition()" in data:
				StartAcquisition(self)
				res = 'printMessage("BeginAcquisition")'
			else: res = eval(data)
			
			self.transport.write(res)
			print "Server sent: %s"%"Ok"
		except Exception as e:
			pass
			print "in exception dataReceived"
			print e
	
	def connectionLost(self, reason):
		global CPTH
		if CPTH:
			if CPTH.acquire == True:
				StopAcquisition()

		connector.stopListening()
		reactor.stop()
		os.system("exit")
		print "Connection LOST!"
		# CPTH.exit()
		CPTH._Thread__stop()
		return
		

def getSettings() :
	f=open(os.path.join(INSDIR,'Settings.json'))
	settings = json.load(f)
	f.close()
	f=open(os.path.join(INSDIR,'Devices.json'))
	devices = json.load(f)
	f.close()
	return 'SetConfigurations('+json.dumps(settings)+','+json.dumps(devices)+')'

def saveConfig(device,macAddress,analogInp,digitalOut,labels,units):
	check = True
	SetToSave = {"Device":device,"MacAddress":macAddress,"Analog":analogInp,"Digital":digitalOut,"Labels": labels, "Units":units}
	f=open(os.path.join(INSDIR,'Settings.json'),'w')
	json.dump(SetToSave,f)
	f.close()
	f=open(os.path.join(INSDIR,'Devices.json'),'r')
	Dev = json.load(f)
	f.close()
	f=open(os.path.join(INSDIR,'Devices.json'),'w')
	for x,devs in enumerate(Dev):
		if Dev[x][0] == macAddress:
			if Dev[x][1] != device:
				Dev[x] = tuple([macAddress,device])
			check = False
			break
	if check: 
		temp = tuple([macAddress,device])
		Dev.append(temp)
	json.dump(Dev,f)
	f.close()
	return 'SetConfigurations('+json.dumps(SetToSave)+','+json.dumps(Dev)+')'

def getRTDatatoFlot(datasets):
	global dataset
	dataset = copy.deepcopy(datasets) 
	data = [];
	for i in numpy.arange(60):
		data.append([i,0])
	for x in datasets:
		datasets[x]['data'] = data
	return 'BuildPage('+json.dumps(datasets,sort_keys=False)+','+json.dumps(datasets,sort_keys=False)+')'

def getFile(path,back):
	if back == False:
		if os.path.isfile(path) == True:
			path = os.path.dirname(path)
		os.chdir(path);
		dirL = os.listdir(os.getcwd());
		dirFinal = [];
		filesFinal = [];
		list=[]
		for i,item in enumerate(dirL):
		 try:
			 json.dumps(item)
			 list.append(item)
		 except:
			 list.append(item.decode("utf-8","ignore"))
		for el in list:
			try:
				if os.path.isdir(os.path.join(os.getcwd(),el)) == True :
					os.listdir(os.path.join(os.getcwd(),el))
					dirFinal.append(el)
				elif os.path.isfile(os.path.join(os.getcwd(),el)) == True and el.split('.')[-1] == 'hdf5' or el.split('.')[-1] == 'txt' :
					filesFinal.append(el)
			except WindowsError:
				pass 
		dir = {"path":os.getcwd(),"dir":dirL,"files":filesFinal};
		dir = {"path":path,"dir":dirFinal,"files":filesFinal};
	else:
		currentDir = path;
		os.chdir(currentDir);
		currentD = os.path.dirname(os.getcwd())
		dirL = os.listdir(currentD);
		dirFinal = [];
		filesFinal = [];
		list=[]
		for i,item in enumerate(dirL):
		 try:
			 json.dumps(item)
			 list.append(item)
		 except:
			 list.append(item.decode("utf-8","ignore"))
		for el in list:
			try:
				if os.path.isdir(os.path.join(currentD,el)) == True :
					os.listdir(os.path.join(currentD,el))
					dirFinal.append(el)
				elif os.path.isfile(os.path.join(currentD,el)) == True and el.split('.')[-1] == 'hdf5' or el.split('.')[-1] == 'txt' :
					filesFinal.append(el)
			except WindowsError:
				pass 
		dir = {"path":currentD,"dir":dirFinal,"files":filesFinal};
	return 'DisplayFiles('+json.dumps(dir)+')'

def SetupAcquisition(MACAddress,channelsList,samplingRate,units):
	import ArduinoToBrowser1 as ArduinoToBrowser
	global CPTH
	try:
		if CPTH:
			# CPTH.exit()
			CPTH.restartVariables()
		else:
			CPTH = ArduinoToBrowser.ThreadArduino()
			CPTH.start()
		CPTH.macAddress = MACAddress 
		CPTH.AnalogChannels = channelsList
		CPTH.SamplingRate = samplingRate
		CPTH.units = units
		CPTH.inoconnect()
		answer = "Connect(true)"
		
	except Exception as e: 
		
		answer = "Connect(false)"
		pass
		print "exception Setup -> ",e
	return answer

def StartAcquisition(protocolReactor):
	global CPTH
	global id
	global StartTime
	global dataset
	StartTime = datetime.datetime.now()
	filename = os.path.join(INSDIR+'/Python/temp', StartTime.strftime("%Y%m%d-%H%M%S")+'-record%s'%id+'.hdf5')
	# Creates HDF5 file to save signals in real time
	fid = h5db.hdf(filename, 'w')
	header = {'id': id, 'date': datetime.datetime.utcnow().isoformat()}
	fid.addInfo(header)
	signalsRT = {}
	blockShape = (CPTH.nSamples,)
	keysSorted = dataset.keys()
	keysSorted.sort()
	for i,j in enumerate(dataset):
		mdata = {'type': '/AnalogInputs/Analog%s'%i,  'name': dataset[keysSorted[i]]['label'].split(' [')[0],'labels': [dataset[keysSorted[i]]['label']]}
		dataName = dataset[keysSorted[i]]['label'].split(' [')[0]
		signalsRT['Analog%s'%i] = fid.addSignalRT(mdata['type'], mdata, dataName, blockShape)
	for i in range(4) :
		mdata = {'type': '/DigitalInputs/Digital%s'%i,  'name': 'Digital%s'%i,'labels': ['Digital%s'%i]}
		dataName = 'Digital%s'%i
		signalsRT['Digital%s'%i] = fid.addSignalRT(mdata['type'], mdata, dataName, blockShape)
		
	mdata = {'type': '/others', 'name': 'SeqN', 'labels':['SeqN']}
	signalsRT['SeqN'] = fid.addSignalRT(mdata['type'], mdata, 'SeqN', blockShape)
	CPTH.file=fid
	CPTH.RT = signalsRT
	CPTH.filename = filename
	
	# Sends command to start acquisition
	CPTH.acquire = True
	CPTH.reactorr = protocolReactor
	id=id+1
	print "Acquisition set to start"

	
def StopAcquisition():
	global EndTime;
	import datetime
	EndTime = datetime.datetime.now()
	CPTH.child.send('END')
	CPTH.RT={}
	return "printMessage('Stop acquisition')"

def saveDigitalOutput(data):
	f=open(os.path.join(INSDIR,'Settings.json'))
	settings = json.load(f)
	f.close()
	settings['Digital'] = data
	f=open(os.path.join(INSDIR,'Settings.json'),'w')
	json.dump(settings,f)
	f.close()
	return 'printMessage("Settings of Digital Output saved!")'
	
def CLOSE():
	global CPTH
	if CPTH:
		if CPTH.acquire == True:
			StopAcquisition()
	reactor.stop()
	return "printMessage('closed')"
	

def listHDF5Signals(file):	
	signals=[]
	#Function to select signals from the hdf5 tree file
	def func(name, obj): 
		if isinstance(obj, h5py._hl.dataset.Dataset): 
			n=name.split('/')
			if n[0] == 'signals' :
				signals.append(name) 
	file.visititems(func)
	return signals

def saveFile(path,file,type):
	global CPTH
	file.decode("utf-8","ignore")
	if type=="txt":
		if file[-4:] == '.txt': file = file[:-4]
		f=h5py.File(CPTH.filename);
		#Txt File
		mdata = f.attrs['json']
		head = eval(mdata)
		
		h = []
		FinalArray = []
		sig = listHDF5Signals(f)
		for s in sig:
			h.append(s.split('/')[-1])
			if len(FinalArray) == 0:
				FinalArray = f[s].value.reshape(len(f[s].value),1)
			else:
				FinalArray = numpy.hstack((FinalArray,f[s].value.reshape(len(f[s].value),1)))
		head['ChannelsOrder'] = h
		numpy.savetxt(path+'/'+file+'.txt',FinalArray,fmt='%0d',delimiter='\t',header=json.dumps(head))
		f.close()
	#hdf5 file
	else:
		if file[-5:] == '.hdf5': file = file[:-5]
		shutil.copy(CPTH.filename,os.path.join(path,file+'.hdf5'))
		f = h5db.hdf(os.path.join(path,file+'.hdf5'))
		mdata = f.getInfo()['header']
		mdata['name'] = file
		f.addInfo(mdata)
		f.close()
	return 'printMessage("saved")'

def changeXScale(UpOrDown):
	global CPTH
	if UpOrDown == 'up':
		if CPTH.t != (len(CPTH.xScale)-1):
			CPTH.t += 1
	else:
		if CPTH.t != 0:
			if CPTH.t == 1 and CPTH.SamplingRate == 1:
				print "sr=1"
				return ""
			else:
				CPTH.t -= 1
	return 'NewXScale('+str(CPTH.xScale[CPTH.t])+')'

def digitalOutputs(DOarray):
	global CPTH
	data = 3
	for i,j in enumerate(DOarray):
		data = data | j<<(2+i)
	CPTH.device.write(data)
	return 'printMessage("DigitalOut done")'

def battery(data):
	global CPTH
	CPTH.device.write(data)
	return 'printMessage("battery threshold set")'


def search():
	f=open(os.path.join(INSDIR,'Devices.json'))
	old_devices = json.load(f)
	f.close()
	for i in range(len(old_devices)):
		old_devices[i] = tuple(old_devices[i])
	nearby_devices = BITalino.BITalino().find()
	bitDevices = []
	for addr,name in nearby_devices:
		if 'bit' in name:
			bitDevices.append((addr,name))
	new = []
	if old_devices != []: 
		new_devices = list(set(zip(*bitDevices)[0])-set(zip(*old_devices)[0]))
		
		for x,i in enumerate(list(zip(*bitDevices)[0])):
			for j in new_devices:
				if i ==j:
					new.append(bitDevices[x])
	else:
		new = bitDevices
	Dev = {}
	Dev['old'] = old_devices
	Dev['new'] = new
	return "SearchDevices("+json.dumps(Dev)+")"

class VSFactory(protocol.Factory):
	def buildProtocol(self, addr):
		return VS()

if __name__=='__main__':
	global INSDIR
	INSDIR = os.getcwd()
	#delete temp files from previous session
	frame = inspect.currentframe()
	filename = inspect.getframeinfo(frame).filename
	pathStd = os.path.dirname(os.path.abspath(filename))
	del frame
	if len(os.listdir(pathStd+'/temp')) != 0:
		for i in os.listdir(pathStd+'/temp'):
			os.remove(pathStd+'/temp'+'/'+i)
	try:
		# Launch WebServer
		ip_addr, port = "127.0.0.1", 9000 # socket.gethostbyname(socket.getfqdn()) #
		print "Listening at port %s of %s\n"%(port, ip_addr)
		pathToHTML = "\"file:///"+ os.path.abspath('OpenSignals.html')+"\""

		connector = reactor.listenTCP(port, WebSocketFactory(VSFactory())) # console to html communication
		os.system('start chrome\GoogleChromePortable.exe --allow-file-access-from-files -kiosk '+pathToHTML)
		
		reactor.run()

	except Exception as e:
		print traceback.format_exc()
		print "Resetting .."
