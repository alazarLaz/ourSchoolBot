const BOT_TOKEN='705989622:AAFCL_2l_b2o6lO8af-SvvuMoRzNBm0kKn4';

/**
 * import the  library;
 */

const fs = require('fs');
const request = require('request');
const Telegraf = require('telegraf')
const Extra = require('telegraf/extra')
const Markup = require('telegraf/markup')
const sqlite3 = require('sqlite3').verbose();
const db = require('./lib.js');
const PDFDocument = require('pdfkit');


/* 

SELECT Teachers.Name,Grades.Name FROM Teachers JOIN Teachers_Grades USING (strudentID) JOIN Grades USING (GradeID)
    WHERE Teachers.Name = "493027565";

*/

/**
 * create a class that contain all the user information 
 * initiate it when the user has an account;
 */

var timeline = ["Today","Last Week","Display All"];

var GradeSection = {"Grade1":["A","B"],"Grade2":["A","B"],"Grade3":["A","B"],"Grade4":["A","B"],"Grade5":["A","B"],"Grade6":["A","B"],"Grade7":["A","B"],"Grade8":["A","B"]}

var GradeSubject = {
    "Grade1":["Science","Amharic","Math","English"],
    "Grade2":["Science","Amharic","Math","English"],
    "Grade3":["Science","Amharic","Math","English"],
    "Grade4":["Science","Amharic","Math","English"],
    "Grade5":["Science","Amharic","Math","English","civics","AfanOromo","SocialStudies"],
    "Grade6":["Science","Amharic","Math","English","civics","AfanOromo","SocialStudies"],
    "Grade7":["Amharic","Math","English","civics","AfanOromo","SocialStudies","Biology","Chemistry","Physics"],
    "Grade8":["Amharic","Math","English","civics","AfanOromo","SocialStudies","Biology","Chemistry","Physics"],
}
var querys = {
    "Today":`SELECT books.FileURL FROM books WHERE Grade = ? AND Section = ? AND Subject=? AND Type=? AND UploadedOn = Date("now");`,
    "Last Week":`SELECT books.FileURL FROM books WHERE Grade = ? AND Section = ? AND Subject=? AND Type=? AND UploadedOn BETWEEN  Date("now","-7 days") AND Date("now","-1 days");`,
    "Display All":`SELECT books.FileURL FROM books WHERE Grade = ? AND Section = ? AND Subject=? AND Type=?;`
};

var options = ["lecture","Assignment"];
var task = ["Upload Document","Delete Document"];
var subjects =  ["Science","Amharic","Math","English","civics","AfanOromo","SocialStudies","Biology","Chemistry","Physics"];

class information{

    allowedGrades;
    selectedGrade;
    sections;
    selectedSection;
    subjects;
    selectedSubject;
    selectedType;
    selectedDate;
    fileName;
    fileID;
    strudentID;
    pdfFiles ;
    selectedPdf;

    constructor(){
    
    }
    getGrades() {
    console.log("start now")
        var list = [];
        for(var i=0; i<this.allowedGrades.length;i++){
        console.log(i)
        list.push(this.allowedGrades[i].Name);
        }
        
        return list;
    }
    reset(){
        this.allowedGrades;
        this.selectedGrade;
        this.sections = sections;
        this.selectedSection;
        this.subjects;
        this.selectedSubject;
        this.selectedType;
        this.selectedDate;
        this.fileName;
        this.fileID;
        this.strudentID;
        this.pdfFiles ;
        this.selectedPdf;
    }
}

const bot = new Telegraf(BOT_TOKEN)

var STATE = {};

bot.action('_informationPage',(ctx)=>{
    ctx.reply("Welcome to Daystar international bot\n 👉 /start to use the bot");
})

bot.command('start', (ctx) => {    
                ctx.reply(`Welcome ${ctx.chat.first_name}`);
                var ChatState = new information();
                ChatState.allowedGrades = db._getArray(ctx.chat.id).Grades;
                ChatState.strudentID = ctx.chat.id;
                STATE[ctx.chat.id] = ChatState;
                ctx.reply('please select grade', db._menuCreaterBack(STATE[ctx.chat.id].getGrades(),'_informationPage'));
            }

);


bot.action('_homeBotton', (ctx)=>{ 
let lists = STATE[ctx.chat.id].getGrades();
console.log(STATE[ctx.chat.id].getGrades())
ctx.reply(`please select your grade`, db._menuCreaterBack(lists,'_informationPage'))})  



function _getGrades (callbackData,ctx) {
console.log("the pressed botton is");
console.log(ctx.update.callback_query.data);
if(ctx.update.callback_query.data != '_exportPdf' && ctx.update.callback_query.data != '_convertPdf' ){
    try{
        var key = ctx.chat.id;
        console.log(STATE[key]);
        var arrGrades = STATE[key].getGrades();
        for(var i=0; i<arrGrades.length;i++){
            if (callbackData === arrGrades[i]){
                STATE[key].selectedGrade = arrGrades[i];
                return callbackData;
            }
        }
    }
    catch(err){
    console.log(err);
    }
}
    
}



function _gradeSetionCreator(ctx,selectedGrade) {
    try{
        var list = [];
        var Match = GradeSection[selectedGrade];
        Match.forEach((section)=>{
            list.push(selectedGrade+" "+section);
        });
        STATE[ctx.chat.id].sections = list;
        return list;
    }
    catch(err){
        console.log(err);
    }
};

function _gradeLoader(ctx,_selectedSection) {

    try{
        ctx.reply(`please select the section for ${STATE[ctx.chat.id].selectedGrade}`,db._menuCreater(_gradeSetionCreator(ctx,_selectedSection)));

    }
    catch(err){
        console.log(err);
    }

}


bot.action(_getGrades, (ctx)=>{ _gradeLoader(ctx,STATE[ctx.chat.id].selectedGrade)})

/**
 * 
 * @param {take grade as an input and return available subject to the user} callbackData 
 * @param {set the available subjects for that grade Sections} ctx 
 */

function _getSection(callbackData,ctx){
    try{
        var key = ctx.chat.id;
        // STATE[key].sectionsMenuState();
        var sections = STATE[key].sections;
        for(var i=0; i<sections.length; i++){
            if(callbackData === sections[i]){
                STATE[key].selectedSection = sections[i];
                return callbackData;
            }   
        }
    }
    catch(err){
        console.log(err);
    }
}

function _sectionSubjectCreator(ctx,selectedGrade) {
    try{
        var subjects  = GradeSubject[selectedGrade];
        STATE[ctx.chat.id].subjects = subjects;
        return subjects;
    }
    catch(err){
        console.log(err);
    }
}


function _sectionLoader(ctx,_selectedMenu_selectedSection) {
    try{
        ctx.reply(`Please select the subject for ${STATE[ctx.chat.id].selectedSection}`,db._menuCreater(_sectionSubjectCreator(ctx,STATE[ctx.chat.id].selectedGrade)));

    }
    catch(err){
        console.log(err);
    }
    // console.log(_selectedMenu);
}

bot.action(_getSection, (ctx)=>{ _sectionLoader(ctx,STATE[ctx.chat.id].selectedSection)})
/**
 * 
 * @param {get the the subject and set the load the selected subject of the material and return it to the call back} callbackData 
 */
function _getSubject(callbackData,ctx){
    try{
        var key = ctx.chat.id
        console.log(key);
        var subjects = STATE[key].subjects;
        for(var i=0;i<subjects.length;i++){
            if(callbackData === subjects[i]){
                STATE[key].selectedSubject = subjects[i];
                return callbackData;
            }
        }
    }
    catch(err){
        console.log(err);
    }
}
function _subjectLoader(ctx,subject) {

   try{
    var key = ctx.chat.id;
    console.log("the selected subjects is");
    console.log(STATE[key].selectedSubject);
    return ctx.reply(`select the type of File for ${STATE[key].selectedSection}  ${STATE[key].selectedSubject}`,db._menuCreater(options));

   }
   catch{

   }
}

bot.action(_getSubject, (ctx)=>{ _subjectLoader(ctx,STATE[ctx.chat.id].selectedSubject)})

/**
 * 
 * @param {get the type of material and set it to the selected type} callbackData 
 * @param {then display the next tasks} ctx 
 */
function _getDate(callbackData,ctx){
    try{
        for(var i=0;i<options.length;i++){
            if(callbackData === options[i]){
                STATE[ctx.chat.id].selectedType = options[i]
                return callbackData;
            }
        }
    }
    catch(err){
        console.log(err);
    }
}
function _taskLoader(ctx,selectedType) {
    try{
        var key = ctx.chat.id;
        return ctx.reply(`Press Display to get All the files for ${STATE[key].selectedSection} ${STATE[key].selectedGrade} ${STATE[key].selectedType} for  ${STATE[key].selectedSection } ${STATE[key].selectedSubject} `,db._menuCreater(["Display"]));
    }
    catch(err){
        console.log(err);
    }
}

bot.action(_getDate, (ctx)=>{ _taskLoader(ctx,STATE[ctx.chat.id].selectedType)})
bot.action('Display', (ctx)=>{
  try{
    var key = ctx.chat.id;
    var list = [];
    var response = db._fetchBook(querys["Display All"],STATE[key].selectedGrade,STATE[key].selectedSection,STATE[key].selectedSubject,STATE[key].selectedType)
    if(response.length<1){
        ctx.reply("no more file left",
        Markup.inlineKeyboard(
            [Markup.callbackButton('Done','_homeBotton')],
        ).extra()
        )
    }
    else{
        response.forEach((row)=>{
            list.push(row.FileURL)
        })
        STATE[key].pdfFiles = list;
        ctx.reply('please select the file',db._menuCreater(STATE[key].pdfFiles));
    }
  }
  catch{

  }
});

function _selectThePdf(callbackData,ctx) {
    try{
        console.log("this is where")
        var key = ctx.chat.id;
        var pdfList = STATE[key].pdfFiles;
        for(var i=0 ;i <pdfList.length; i++){
            if(callbackData == pdfList[i]){
                STATE[key].selectedPdf = pdfList[i];
                console.log(STATE[key].selectedPdf);
                console.log(i);
                return callbackData;
            }
    }
    }
    catch{

    }
  }


bot.action(_selectThePdf,(ctx)=>{
    ctx.reply("press Get to get the pdf",db._menuCreater(["Get"]));
})


bot.action("Get",(ctx)=>{
        var key = ctx.chat.id;
        var pdfName = STATE[key].selectedPdf;
        ctx.replyWithDocument({source:`./books/${STATE[key].selectedPdf}`,
        filename: `${pdfName}`
    })

})


bot.launch()