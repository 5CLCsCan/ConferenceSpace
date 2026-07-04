import json
import codecs
import os

json_path = 'd:/Sh3n/ConferenceSpace/forms/conference_survey.json'
output_path = 'd:/Sh3n/ConferenceSpace/forms/create_form.gs'

with codecs.open(json_path, 'r', 'utf-8') as f:
    data = json.load(f)

js_code = """
function createConferenceForm() {
  var formData = """ + json.dumps(data, ensure_ascii=False, indent=2) + """;
  
  var form = FormApp.create(formData.survey_title);
  form.setDescription(formData.survey_description);
  form.setProgressBar(true);
  
  // Page 1: Role Selection
  var roleItem = form.addMultipleChoiceItem();
  roleItem.setTitle(formData.pages[0].questions[0].question)
          .setRequired(true);
          
  // Page 2: Chair
  var chairPage = form.addPageBreakItem()
      .setTitle(formData.pages[1].title)
      .setHelpText(formData.pages[1].description);
  addQuestions(form, formData.pages[1].questions);
  chairPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  
  // Page 3: Author
  var authorPage = form.addPageBreakItem()
      .setTitle(formData.pages[2].title)
      .setHelpText(formData.pages[2].description);
  addQuestions(form, formData.pages[2].questions);
  authorPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  
  // Page 4: Reviewer
  var reviewerPage = form.addPageBreakItem()
      .setTitle(formData.pages[3].title)
      .setHelpText(formData.pages[3].description);
  addQuestions(form, formData.pages[3].questions);
  reviewerPage.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  
  // Set branching logic on the first question
  roleItem.setChoices([
    roleItem.createChoice(formData.pages[0].questions[0].options[0].label, chairPage),
    roleItem.createChoice(formData.pages[0].questions[0].options[1].label, authorPage),
    roleItem.createChoice(formData.pages[0].questions[0].options[2].label, reviewerPage)
  ]);
  
  Logger.log("Form created successfully!");
  Logger.log("Edit URL: " + form.getEditUrl());
  Logger.log("Published URL: " + form.getPublishedUrl());
}

function addQuestions(form, questions) {
  for (var i = 0; i < questions.length; i++) {
    var q = questions[i];
    if (q.type === 'MULTIPLE_CHOICE') {
      var item = form.addMultipleChoiceItem();
      item.setTitle(q.question);
      if (q.options) item.setChoiceValues(q.options);
      if (q.required) item.setRequired(true);
    } else if (q.type === 'CHECKBOXES') {
      var item = form.addCheckboxItem();
      item.setTitle(q.question);
      if (q.options) item.setChoiceValues(q.options);
      if (q.required) item.setRequired(true);
    } else if (q.type === 'SCALE') {
      var item = form.addScaleItem();
      item.setTitle(q.question);
      item.setBounds(q.min, q.max);
      item.setLabels(q.min_label, q.max_label);
      if (q.required) item.setRequired(true);
    } else if (q.type === 'YES_NO') {
      var item = form.addMultipleChoiceItem();
      item.setTitle(q.question);
      item.setChoiceValues(['Có', 'Không']);
      if (q.required) item.setRequired(true);
    } else if (q.type === 'PARAGRAPH') {
      var item = form.addParagraphTextItem();
      item.setTitle(q.question);
      if (q.required) item.setRequired(true);
    }
  }
}
"""

with codecs.open(output_path, 'w', 'utf-8') as f:
    f.write(js_code)
