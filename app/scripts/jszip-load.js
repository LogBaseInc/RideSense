(function(){var pretty=function(str)
{var res='',code,i;for(i=0;i<str.length;i++)
{code=str.charCodeAt(i);res+='\\x'+(code<10?"0":"")+ code.toString(16);}
return res;};var findCompression=function(compressionMethod)
{for(var method in JSZip.compressions)
{if(JSZip.compressions[method].magic===compressionMethod)
{return JSZip.compressions[method];}}
return null;};function StreamReader(stream){this.stream=stream;this.index=0;}
StreamReader.prototype={checkOffset:function(offset)
{this.checkIndex(this.index+ offset);},checkIndex:function(newIndex)
{if(this.stream.length<newIndex||newIndex<0)
{throw new Error("End of stream reached (stream length = "+
this.stream.length+", asked index = "+
(newIndex)+"). Corrupted zip ?");}},setIndex:function(newIndex)
{this.checkIndex(newIndex);this.index=newIndex;},eof:function()
{return this.index>=this.stream.length;},byteAt:function(i)
{return this.stream.charCodeAt(i)&0xff;},readByte:function()
{this.checkOffset(1);return this.byteAt(1+ this.index++);},readInt:function(size)
{var result=0,i;this.checkOffset(size);for(i=size- 1;i>=0;i--)
{result=(result<<8)+ this.byteAt(this.index+ i);}
this.index+=size;return result;},readString:function(size)
{var result="",i,code;this.checkOffset(size);for(i=0;i<size;i++)
{code=this.byteAt(this.index+ i);result+=String.fromCharCode(code);}
this.index+=size;return result;},readDate:function()
{var dostime=this.readInt(4);return new Date(((dostime>>25)&0x7f)+ 1980,((dostime>>21)&0x0f)- 1,(dostime>>16)&0x1f,(dostime>>11)&0x1f,(dostime>>5)&0x3f,(dostime&0x1f)<<1);}};function ZipEntry(options,loadOptions)
{this.options=options;this.loadOptions=loadOptions;}
ZipEntry.prototype={isEncrypted:function()
{return(this.bitFlag&0x0001)===0x0001;},hasDataDescriptor:function()
{return(this.bitFlag&0x0008)===0x0008;},useUTF8:function()
{return(this.bitFlag&0x0800)===0x0800;},isZIP64:function()
{return this.options.zip64;},readLocalPartHeader:function(reader)
{this.versionNeeded=reader.readInt(2);this.bitFlag=reader.readInt(2);this.compressionMethod=reader.readString(2);this.date=reader.readDate();this.crc32=reader.readInt(4);this.compressedSize=reader.readInt(4);this.uncompressedSize=reader.readInt(4);this.fileNameLength=reader.readInt(2);this.extraFieldsLength=reader.readInt(2);if(this.isEncrypted())
{throw new Error("Encrypted zip are not supported");}},readLocalPart:function(reader)
{var compression;this.readLocalPartHeader(reader);this.fileName=reader.readString(this.fileNameLength);this.readExtraFields(reader);if(!this.hasDataDescriptor())
{this.compressedFileData=reader.readString(this.compressedSize);}
else
{this.compressedFileData=this.findDataUntilDataDescriptor(reader);this.crc32=reader.readInt(4);this.compressedSize=reader.readInt(this.isZIP64()?8:4);this.uncompressedSize=reader.readInt(this.isZIP64()?8:4);if(this.compressedFileData.length!==this.compressedSize)
{throw new Error("Bug : data descriptor incorrectly read (size mismatch)");}}
this.uncompressedFileData=null;compression=findCompression(this.compressionMethod);if(compression===null)
{throw new Error("Corrupted zip : compression "+ pretty(this.compressionMethod)+" unknown (inner file : "+ this.fileName+")");}
this.uncompressedFileData=compression.uncompress(this.compressedFileData);if(this.loadOptions.checkCRC32&&JSZip.prototype.crc32(this.uncompressedFileData)!==this.crc32)
{throw new Error("Corrupted zip : CRC32 mismatch");}
if(this.useUTF8())
{this.fileName=JSZip.prototype.utf8decode(this.fileName);}},findDataUntilDataDescriptor:function(reader)
{var data="",buffer=reader.readString(4),aByte;while(buffer!==JSZip.signature.DATA_DESCRIPTOR)
{aByte=reader.readString(1);data+=buffer.slice(0,1);buffer=(buffer+ aByte).slice(-4);}
return data;},readCentralPart:function(reader)
{this.versionMadeBy=reader.readString(2);this.readLocalPartHeader(reader);this.fileCommentLength=reader.readInt(2);this.diskNumberStart=reader.readInt(2);this.internalFileAttributes=reader.readInt(2);this.externalFileAttributes=reader.readInt(4);this.localHeaderOffset=reader.readInt(4);this.fileName=reader.readString(this.fileNameLength);this.readExtraFields(reader);this.fileComment=reader.readString(this.fileCommentLength);if(this.useUTF8())
{this.fileName=JSZip.prototype.utf8decode(this.fileName);this.fileComment=JSZip.prototype.utf8decode(this.fileComment);}
this.dir=this.externalFileAttributes&0x00000010?true:false;},parseZIP64ExtraField:function(reader)
{var extraReader=new StreamReader(this.extraFields[0x0001].value);if(this.uncompressedSize===-1)
{this.uncompressedSize=extraReader.readInt(8);}
if(this.compressedSize===-1)
{this.compressedSize=extraReader.readInt(8);}
if(this.localHeaderOffset===-1)
{this.localHeaderOffset=extraReader.readInt(8);}
if(this.diskNumberStart===-1)
{this.diskNumberStart=extraReader.readInt(4);}},readExtraFields:function(reader)
{var start=reader.index,extraFieldId,extraFieldLength,extraFieldValue;this.extraFields=this.extraFields||{};while(reader.index<start+ this.extraFieldsLength)
{extraFieldId=reader.readInt(2);extraFieldLength=reader.readInt(2);extraFieldValue=reader.readString(extraFieldLength);this.extraFields[extraFieldId]={id:extraFieldId,length:extraFieldLength,value:extraFieldValue};}
if(this.isZIP64()&&this.extraFields[0x0001])
{this.parseZIP64ExtraField(reader);}}};function ZipEntries(data,loadOptions)
{this.files=[];this.loadOptions=loadOptions;if(data)this.load(data);}
ZipEntries.prototype={checkSignature:function(expectedSignature)
{var signature=this.reader.readString(4);if(signature!==expectedSignature)
{throw new Error("Corrupted zip or bug : unexpected signature "+"("+ pretty(signature)+", expected "+ pretty(expectedSignature)+")");}},readBlockEndOfCentral:function()
{this.diskNumber=this.reader.readInt(2);this.diskWithCentralDirStart=this.reader.readInt(2);this.centralDirRecordsOnThisDisk=this.reader.readInt(2);this.centralDirRecords=this.reader.readInt(2);this.centralDirSize=this.reader.readInt(4);this.centralDirOffset=this.reader.readInt(4);this.zipCommentLength=this.reader.readInt(2);this.zipComment=this.reader.readString(this.zipCommentLength);},readBlockZip64EndOfCentral:function()
{this.zip64EndOfCentralSize=this.reader.readInt(8);this.versionMadeBy=this.reader.readString(2);this.versionNeeded=this.reader.readInt(2);this.diskNumber=this.reader.readInt(4);this.diskWithCentralDirStart=this.reader.readInt(4);this.centralDirRecordsOnThisDisk=this.reader.readInt(8);this.centralDirRecords=this.reader.readInt(8);this.centralDirSize=this.reader.readInt(8);this.centralDirOffset=this.reader.readInt(8);this.zip64ExtensibleData={};var extraDataSize=this.zip64EndOfCentralSize- 44,index=0,extraFieldId,extraFieldLength,extraFieldValue;while(index<extraDataSize)
{extraFieldId=this.reader.readInt(2);extraFieldLength=this.reader.readInt(4);extraFieldValue=this.reader.readString(extraFieldLength);this.zip64ExtensibleData[extraFieldId]={id:extraFieldId,length:extraFieldLength,value:extraFieldValue};}},readBlockZip64EndOfCentralLocator:function()
{this.diskWithZip64CentralDirStart=this.reader.readInt(4);this.relativeOffsetEndOfZip64CentralDir=this.reader.readInt(8);this.disksCount=this.reader.readInt(4);if(this.disksCount>1)
{throw new Error("Multi-volumes zip are not supported");}},readLocalFiles:function()
{var i,file;for(i=0;i<this.files.length;i++)
{file=this.files[i];this.reader.setIndex(file.localHeaderOffset);this.checkSignature(JSZip.signature.LOCAL_FILE_HEADER);file.readLocalPart(this.reader);}},readCentralDir:function()
{var file;this.reader.setIndex(this.centralDirOffset);while(this.reader.readString(4)===JSZip.signature.CENTRAL_FILE_HEADER)
{file=new ZipEntry({zip64:this.zip64},this.loadOptions);file.readCentralPart(this.reader);this.files.push(file);}},readEndOfCentral:function()
{var offset=this.reader.stream.lastIndexOf(JSZip.signature.ZIP64_CENTRAL_DIRECTORY_LOCATOR);if(offset===-1)
{this.zip64=false;offset=this.reader.stream.lastIndexOf(JSZip.signature.CENTRAL_DIRECTORY_END);if(offset===-1)
{throw new Error("Corrupted zip : can't find end of central directory");}
this.reader.setIndex(offset);this.checkSignature(JSZip.signature.CENTRAL_DIRECTORY_END);this.readBlockEndOfCentral();}
else
{this.zip64=true;this.reader.setIndex(offset);this.checkSignature(JSZip.signature.ZIP64_CENTRAL_DIRECTORY_LOCATOR);this.readBlockZip64EndOfCentralLocator();this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);this.checkSignature(JSZip.signature.ZIP64_CENTRAL_DIRECTORY_END);this.readBlockZip64EndOfCentral();}},load:function(data)
{this.reader=new StreamReader(data);this.readEndOfCentral();this.readCentralDir();this.readLocalFiles();}};JSZip.prototype.load=function(data,options)
{var files,zipEntries,i,input;options=options||{};if(options.base64)
{data=JSZipBase64.decode(data);}
zipEntries=new ZipEntries(data,options);files=zipEntries.files;for(i in files)
{input=files[i];this.file(input.fileName,input.uncompressedFileData,{binary:true,date:input.date,dir:input.dir});}
return this;};})();