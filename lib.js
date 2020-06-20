const sqlite3 = require('sqlite3').verbose();
var deasync = require('deasync');

const fs = require('fs');
const request = require('request');
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')

const BOT_TOKEN = "1102994731:AAGYaDOf4LZer8Sf-gEqbH8ck_aguGgKxlk";

/**
 * check if a given book exist in the databse
 * @param(teacherId,secion,docName)
 */
doesExist = function (teacherID,section,subject,type,fileURL){
    
    let solution = null;

    let db = new sqlite3.Database('./database/botdata.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
            return console.error(err.message);
        }
      });
    var query='SELECT * FROM books WHERE teacherID=? AND section=? AND subject=? AND type=? AND fileURL=?;'
    db.all(query,[teacherID,section,subject,type,fileURL],function(err,rows){
        if(err){
            console.log(err);
        }
       solution =rows;
    });

    db.close();

    while(solution==null){
        deasync.runLoopOnce();
    }  
    return solution!=0;
}
exports._exist = function (fileURL){
    
  let solution = null;

  let db = new sqlite3.Database('./database/botdata.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
          return console.error(err.message);
      }
    });
  var query='SELECT * FROM books WHERE fileURL=?;'
  db.all(query,[fileURL],function(err,rows){
      if(err){
          console.log(err);
      }
     solution =rows;
  });

  db.close();

  while(solution==null){
      deasync.runLoopOnce();
  }  
  return solution;
}


/**
 *  delete a specific file from the database
 * takes three parameter
 *  @param(teahcerId,section,docName)
 */
exports._deleteDoc =function (teacherID,grade,section,subject,type,fileURL){
    let sol = null;
    let db = new sqlite3.Database('./database/botdata.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        return console.error(err.message);
      }
    });
    
    var query='DELETE FROM books WHERE TeacherID=? AND Grade=? AND Section=? AND Subject=? AND Type=? AND fileURL=?;'
    if(doesExist(teacherID,section,subject,type,fileURL)){
        db.run(query,[teacherID,grade,section,subject,type,fileURL],(err,rows)=>{
            if(err){
              console.log(err);
            }
            
            sol = `Document ${fileURL} sucessfully deleted`;
          });
    }else{
        sol = "There is no Document with the given name";
    }
    db.close();
    while(sol==null){
        deasync.runLoopOnce();
    }
    return sol;
  }
/**
 * this will print out all the document the teacher uploaded for specific class 
 * @param("teacher id",section)
 */
  exports._viewer= function (teacherID,grade,section,subject,type){
    let sol = null;
    let db = new sqlite3.Database('./database/botdata.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        return console.error(err.message);
      }
    });
    
    var query='SELECT * FROM books WHERE TeacherID=? AND Grade=? AND Section=? AND Subject=? AND Type=? ORDER BY UploadedOn DESC;'
    db.all(query,[teacherID,grade,section,subject,type],(err,rows)=>{
      if(err){
        console.log(err);
      }
      sol = rows;
    })
    db.close();
    while(sol==null){
        deasync.runLoopOnce();
    }
    return sol;
  }
/**
 * add teacher to the teachers table in the databse
 * @param(teacherID)
 */
  exports._addTeacher = function (teacherID){
    let db = new sqlite3.Database('./database/botdata.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Connected');
    });
    
    //add the data to the database
    db.run(`INSERT INTO teachers(teacherID) VALUES (?)`, [teacherID], function(err) {
      if (err) {
        return console.log(err.message);
      }
      // get the last insert id   
      console.log(`A row has been inserted with rowid ${this.lastID}`);
    });
    
    // close the database connection
    db.close((err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Close the database connection.');
    });
  }
  /**
   * add book to the book table at the database
   * to specific column
   * @param(techerid,section,filepath)
   */

  exports._addBook = function(teacherID,grade,section,subject,type,fileurl){
      let db = new sqlite3.Database('./database/botdata.db', sqlite3.OPEN_READWRITE, (err) => {
          if (err) {
            return console.error(err.message);
          }
          console.log('Connected');
        });
        
        //add the data to the database
        var query = `INSERT INTO books(TeacherID,Grade,Section,Subject,Type,FileURL,UploadedOn) VALUES (?,?,?,?,?,?,DATE('now'))`;
        db.run(query, [teacherID,grade,section,subject,type,fileurl], function(err) {
          if (err) {
            return console.log(err.message);
          }
          // get the last insert id   
          console.log(`A row has been inserted with rowid ${this.lastID}`);
        });
        
        // close the database connection
        db.close((err) => {
          if (err) {
            return console.error(err.message);
          }
          console.log('Close the database connection.');
        });
  }

/**
 * check is the teacher has accest to the databse
 * @param(useid)
 *  */  
exports._hasAccess = function(TID){
    let  autenticate=null;
    let db = new sqlite3.Database('./database/botdata.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          return console.error(err.message);
        }
      });
    var query='SELECT * FROM teachers WHERE Name=(?);'
    db.all(query,[TID],(err,rows)=>{
        if(err){
            console.log(err);
        }
        autenticate = rows;
        
    })
    db.close();
    while(autenticate==null){
        deasync.runLoopOnce();
    }
    return autenticate!=0;
}
/**
 * 
 * get the array for a preson with specific ID
 * 
 */
exports._getArray = (id)=>{
  let Grades = null;
    let db = new sqlite3.Database('./database/botdata.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        return console.error(err.message);
      }
    });
    var query1="SELECT GradeID, Grades.Name FROM Teachers JOIN Teachers_Grades USING (TeacherID) JOIN Grades USING (GradeID) WHERE Teachers.Name=(?) ORDER BY Grades.Name ASC;"
    db.all(query1,[id],(err,rows)=>{
      if(err){
        console.log(err);
      }
      Grades = rows;
    })


    db.close();
    while(Grades==null){
        deasync.runLoopOnce();
    }
    return {Grades};
}



exports._separator = function (arrayVal){
  let sepatated = [];
  let localSep="";
  for(var i=0; i<arrayVal.length;i++){
    if(arrayVal[i]!="_"){
      localSep+=arrayVal[i];
    }else{
      sepatated.push(localSep);
      localSep="";
    }
  }
  sepatated.push(localSep);
  return sepatated;
}
exports._sectionCreator = function(grades){
  let ans="";
  for(var i=0; i<grades.length-7;i++){
      ans+=grades[i];
  }
  return ans;
}

exports._menuCreater = function (arrGrades) {
  return  testMenu = Telegraf.Extra
  .markdown()
  .markup((m) => {
      let list = [];
      var i=0;
      for(i; i<arrGrades.length;i+=2){
        if(i+1<arrGrades.length){
          list.push([m.callbackButton(arrGrades[i],arrGrades[i]),
                   m.callbackButton(arrGrades[i+1],arrGrades[i+1])]);
        }else{
          break;
        }
      }
      if(i<arrGrades.length){
        list.push([m.callbackButton(arrGrades[i],arrGrades[i])]);
      }
      list.push([m.callbackButton('Back To Home','_homeBotton')])
      console.log(i);
      return m.inlineKeyboard(list);
  });
}

exports._menuCreaterBack = function (arrGrades,backState) {
  return  testMenu = Telegraf.Extra
  .markdown()
  .markup((m) => {
      let list = [];
      var i=0;
      for(i; i<arrGrades.length;i+=2){
        if(i+1<arrGrades.length){
          list.push([m.callbackButton(arrGrades[i],arrGrades[i]),
                   m.callbackButton(arrGrades[i+1],arrGrades[i+1])]);
        }else{
          break;
        }
      }
      if(i<arrGrades.length){
        list.push([m.callbackButton(arrGrades[i],arrGrades[i])]);
      }
      list.push([m.callbackButton('Done','_homeBotton'),
                  m.callbackButton('Back', backState)])
      console.log(i);
      return m.inlineKeyboard(list);
  });
}

exports._getURL = function(fileID){
  let sol = null;
  let _sendUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileID}`;
  request(_sendUrl, function(err, res, body) {
    let json = JSON.parse(body);
    path = json.result.file_path 
    sol = path;
    url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${sol}`
  });
  while(sol==null){
      deasync.runLoopOnce();
  }
  return {'URL':url,'path':sol};
}

exports._getSpecificFiles = (id)=>{
  var list = [];
  fs.readdir("./local_images/", (err, files) => {
  files.forEach(file => {
    console.log(file.slice(0,9)==id);
    if(file.slice(9)==id){
      list.push(file);
    }
  });
});
return list;
}


exports._allowedSubject = (TID,selectedSubject)=>{
      
  let solution = null;

  let db = new sqlite3.Database('./database/botdata.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
          return console.error(err.message);
      }
    });
  var query="SELECT Subjects.Name FROM Teachers JOIN Teachers_Subjects USING (TeacherID) JOIN Subjects USING (SubjectID) WHERE Teachers.Name=(?);"
  db.all(query,[TID],function(err,rows){
      if(err){
          console.log(err);
      }
     solution =rows;
  });

  db.close();

  while(solution==null){
      deasync.runLoopOnce();
  } 
  
  for(var i=0; i<solution.length;i++){
    if(solution[i].Name == selectedSubject ){
      return true;
    }
  }
  return false;
}


exports._fileUpload = function(_fileID,_fileName){
  console.log("hi");
  let _sendUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${_fileID}`;
  console.log(_sendUrl);
  request(_sendUrl, function(err, res, body) {
      let json = JSON.parse(body);
      path = json.result.file_path
      const url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${path}`
      console.log(url);
      download(url,_fileName);
  });
};


download = (url, dest, cb) => {
  let upload_path = `./books/${dest}`;
  const file = fs.createWriteStream(upload_path);
  const sendReq = request.get(url);

  // verify response code
  sendReq.on('response', (response) => {
      if (response.statusCode !== 200) {
          return cb('Response status was ' + response.statusCode);
      }

      sendReq.pipe(file);
  });

  // close() is async, call cb after close completes
  file.on('finish', () => file.close(cb));

  // check for request errorsconst fs = require('fs');
  sendReq.on('error', (err) => {
      fs.unlink(upload_path);
      return cb(err.message);
  });

  file.on('error', (err) => { // Handle errors
      fs.unlink(upload_path); // Delete the file async. (But we don't check the result)
      return cb(err.message);
  });
};

exports._deleteFile = (filename)=>{
  var path = `./books/${filename}`;
  fs.unlinkSync(path,(err)=>{
    if(err){
      throw err;
    }
  })
}
exports._fetchBook = (query,grade,section,subject,type)=>{
    let pdfs = null;
    let db = new sqlite3.Database('./database/botdata.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        return console.error(err.message);
      }
    });
    db.all(query,[grade,section,subject,type],(err,rows)=>{
      if(err){
        console.log(err);
      }
      console.log(rows);
      pdfs = rows;
    })

    db.close();
    while(pdfs==null){
        deasync.runLoopOnce();
    }
    return pdfs;
}