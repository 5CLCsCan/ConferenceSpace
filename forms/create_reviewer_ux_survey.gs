/**
 * ConferenceSpace — Reviewer UX Survey
 *
 * Creates a Google Form with anonymous-response branching:
 * - "Ẩn danh" skips the contact section
 * - "Không ẩn danh" shows email/contact field before role questions
 *
 * Setup:
 * 1. Go to https://script.google.com → New project
 * 2. Paste this file
 * 3. Run createReviewerUxSurvey() once (authorize when prompted)
 * 4. Copy FORM_ID from the log, set it in SURVEY_FORM_ID below
 * 5. Run installSubmitTrigger() once
 *
 * For an existing form, run setupAnonymousModeOnExistingForm() instead.
 */

var SURVEY_FORM_ID = ''; // e.g. '1FAIpQLSf...' from form URL

var ANONYMOUS_CHOICE = 'Ẩn danh';
var CONTACT_CHOICE = 'Không ẩn danh';
var MODE_QUESTION_TITLE = 'Bạn có muốn ẩn danh không?';
var EMAIL_QUESTION_TITLE = 'Email hoặc số liên hệ của bạn là gì?';

// ---------------------------------------------------------------------------
// Create form from embedded JSON
// ---------------------------------------------------------------------------

function createReviewerUxSurvey() {
  var formData = getReviewerSurveyData_();

  var form = FormApp.create(formData.title);
  form.setDescription(formData.description);
  form.setConfirmationMessage(formData.confirmationMessage);
  form.setCollectEmail(false);
  form.setProgressBar(true);

  var anonymousModeItem = null;
  var emailSectionBreak = null;
  var roleSectionBreak = null;

  for (var i = 0; i < formData.items.length; i++) {
    var item = formData.items[i];

    if (item.id === 'anonymous_mode') {
      anonymousModeItem = addFormItem_(form, item);
      continue;
    }

    if (item.id === 'email_section') {
      emailSectionBreak = addFormItem_(form, item);
      continue;
    }

    if (item.id === 'contact_email') {
      addFormItem_(form, item);
      continue;
    }

    if (item.id === 'role_section') {
      roleSectionBreak = addFormItem_(form, item);
      continue;
    }

    if (item.id === 'main_survey_start') {
      addFormItem_(form, item);
      continue;
    }

    addFormItem_(form, item);
  }

  if (!anonymousModeItem || !emailSectionBreak || !roleSectionBreak) {
    throw new Error('Missing anonymous branching anchors in survey JSON.');
  }

  applyAnonymousBranching_(anonymousModeItem, emailSectionBreak, roleSectionBreak);

  Logger.log('Form created successfully.');
  Logger.log('Form ID: ' + form.getId());
  Logger.log('Edit URL: ' + form.getEditUrl());
  Logger.log('Published URL: ' + form.getPublishedUrl());
  Logger.log('Next: set SURVEY_FORM_ID = "' + form.getId() + '" then run installSubmitTrigger().');

  return form;
}

// ---------------------------------------------------------------------------
// Add anonymous mode to an existing Google Form (manual import)
// ---------------------------------------------------------------------------

/**
 * Use when you already created the form in Google Forms UI.
 * Inserts anonymous-mode questions right after the consent question.
 *
 * @param {string} formId Google Form ID
 */
function setupAnonymousModeOnExistingForm(formId) {
  formId = formId || SURVEY_FORM_ID;
  if (!formId) {
    throw new Error('Provide formId or set SURVEY_FORM_ID.');
  }

  var form = FormApp.openById(formId);
  var items = form.getItems();

  // Insert after first item (consent question)
  var insertIndex = 1;

  var modeQuestion = form.insertMultipleChoiceItem(insertIndex++);
  modeQuestion.setTitle(MODE_QUESTION_TITLE);
  modeQuestion.setRequired(true);
  modeQuestion.setChoiceValues([ANONYMOUS_CHOICE, CONTACT_CHOICE]);

  var emailSection = form.insertPageBreakItem(insertIndex++);
  emailSection.setTitle('Trang thông tin liên hệ');

  var emailQuestion = form.insertTextItem(insertIndex++);
  emailQuestion.setTitle(EMAIL_QUESTION_TITLE);
  emailQuestion.setRequired(false);

  var roleSection = form.insertPageBreakItem(insertIndex++);
  roleSection.setTitle('Thông tin vai trò');

  var academicRole = form.insertMultipleChoiceItem(insertIndex++);
  academicRole.setTitle('Bạn hiện là ai trong môi trường học thuật/nghiên cứu?');
  academicRole.setChoiceValues([
    'Sinh viên đại học',
    'Học viên cao học / nghiên cứu sinh',
    'Giảng viên / nhà nghiên cứu',
    'Nhân sự quản lý học thuật / thư ký khoa học',
    'Người làm trong doanh nghiệp có tham gia hội nghị khoa học'
  ]);
  academicRole.showOtherOption(true);

  var conferenceRole = form.insertCheckboxItem(insertIndex++);
  conferenceRole.setTitle(
    'Vị trí chuyên môn của bạn trong các hội nghị thường tham gia là gì (hoặc vị trí tương đương)?'
  );
  conferenceRole.setHelpText('Ví dụ: General Chair, PC Member, Tác giả, Subreviewer...');
  conferenceRole.setChoiceValues([
    'General Chair / PC Chair / Ban tổ chức',
    'Track Chair / Session Chair',
    'Program Committee (PC) Member / Reviewer',
    'Author / Subreviewer',
    'Listener / Khách mời tham dự',
    'Không có vị trí cụ thể'
  ]);
  conferenceRole.showOtherOption(true);

  var mainSection = form.insertPageBreakItem(insertIndex++);
  mainSection.setTitle('Thông tin sử dụng');

  applyAnonymousBranching_(modeQuestion, emailSection, roleSection);

  Logger.log('Anonymous mode configured on existing form.');
  Logger.log('Published URL: ' + form.getPublishedUrl());
}

// ---------------------------------------------------------------------------
// Submit trigger — enforce anonymity in stored responses
// ---------------------------------------------------------------------------

function installSubmitTrigger() {
  if (!SURVEY_FORM_ID) {
    throw new Error('Set SURVEY_FORM_ID before installing the trigger.');
  }

  var existing = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].getHandlerFunction() === 'onReviewerSurveySubmit') {
      ScriptApp.deleteTrigger(existing[i]);
    }
  }

  ScriptApp.newTrigger('onReviewerSurveySubmit')
    .forForm(FormApp.openById(SURVEY_FORM_ID))
    .onFormSubmit()
    .create();

  Logger.log('Submit trigger installed for form ' + SURVEY_FORM_ID);
}

/**
 * Clears email from the response sheet when respondent chose anonymous mode.
 * Also works if someone manually navigates to the email page.
 */
function onReviewerSurveySubmit(e) {
  if (!e || !e.response) {
    return;
  }

  var itemResponses = e.response.getItemResponses();
  var isAnonymous = false;
  var emailItemResponse = null;

  for (var i = 0; i < itemResponses.length; i++) {
    var ir = itemResponses[i];
    var title = ir.getItem().getTitle();

    if (title === MODE_QUESTION_TITLE) {
      isAnonymous = ir.getResponse() === ANONYMOUS_CHOICE;
    }

    if (title === EMAIL_QUESTION_TITLE) {
      emailItemResponse = ir;
    }
  }

  if (isAnonymous && emailItemResponse && emailItemResponse.getResponse()) {
    // Google Forms API cannot edit a submitted response directly.
    // Clear email in the linked spreadsheet instead.
    clearEmailInResponseSheet_(e.response.getId(), EMAIL_QUESTION_TITLE);
  }
}

function clearEmailInResponseSheet_(responseId, emailColumnTitle) {
  var form = FormApp.openById(SURVEY_FORM_ID);
  var destinationId = form.getDestinationId();
  if (!destinationId) {
    return;
  }

  var sheet = SpreadsheetApp.openById(destinationId).getSheets()[0];
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var emailColIndex = headers.indexOf(emailColumnTitle);
  if (emailColIndex === -1) {
    return;
  }

  // Timestamp is column A; find row by matching response timestamp
  var response = FormApp.openById(SURVEY_FORM_ID).getResponses().filter(function(r) {
    return r.getId() === responseId;
  })[0];

  if (!response) {
    return;
  }

  var timestamp = response.getTimestamp();
  var data = sheet.getDataRange().getValues();
  for (var row = 1; row < data.length; row++) {
    if (data[row][0].getTime && data[row][0].getTime() === timestamp.getTime()) {
      sheet.getRange(row + 1, emailColIndex + 1).setValue('');
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Branching helpers
// ---------------------------------------------------------------------------

function applyAnonymousBranching_(modeQuestion, emailSectionBreak, roleSectionBreak) {
  modeQuestion.setChoices([
    modeQuestion.createChoice(ANONYMOUS_CHOICE, roleSectionBreak),
    modeQuestion.createChoice(CONTACT_CHOICE, emailSectionBreak)
  ]);
  emailSectionBreak.setGoToPage(roleSectionBreak);
}

function addFormItem_(form, item) {
  var type = item.type;

  if (type === 'PAGE_BREAK') {
    var page = form.addPageBreakItem();
    page.setTitle(item.title || '');
    if (item.helpText) {
      page.setHelpText(item.helpText);
    }
    return page;
  }

  if (type === 'MULTIPLE_CHOICE') {
    var mc = form.addMultipleChoiceItem();
    mc.setTitle(item.title);
    if (item.helpText) {
      mc.setHelpText(item.helpText);
    }
    mc.setRequired(!!item.required);
    var choices = (item.choices || []).map(function(c) {
      return c.value;
    });
    if (item.hasOtherOption) {
      mc.setChoiceValues(choices);
      mc.showOtherOption(true);
    } else {
      mc.setChoiceValues(choices);
    }
    return mc;
  }

  if (type === 'CHECKBOX') {
    var cb = form.addCheckboxItem();
    cb.setTitle(item.title);
    if (item.helpText) {
      cb.setHelpText(item.helpText);
    }
    cb.setRequired(!!item.required);
    var cbChoices = (item.choices || []).map(function(c) {
      return c.value;
    });
    cb.setChoiceValues(cbChoices);
    if (item.hasOtherOption) {
      cb.showOtherOption(true);
    }
    return cb;
  }

  if (type === 'TEXT') {
    var text = form.addTextItem();
    text.setTitle(item.title);
    if (item.helpText) {
      text.setHelpText(item.helpText);
    }
    text.setRequired(!!item.required);
    return text;
  }

  if (type === 'PARAGRAPH_TEXT') {
    var para = form.addParagraphTextItem();
    para.setTitle(item.title);
    if (item.helpText) {
      para.setHelpText(item.helpText);
    }
    para.setRequired(!!item.required);
    return para;
  }

  if (type === 'GRID') {
    var grid = form.addGridItem();
    grid.setTitle(item.title);
    if (item.helpText) {
      grid.setHelpText(item.helpText);
    }
    grid.setRequired(!!item.required);
    grid.setRows(item.rows || []);
    grid.setColumns(item.columns || []);
    return grid;
  }

  throw new Error('Unsupported item type: ' + type);
}

// ---------------------------------------------------------------------------
// Survey data (matches forms/reviewer_ux_survey.json)
// ---------------------------------------------------------------------------

function getReviewerSurveyData_() {
  return {
    title: 'Khảo sát mức độ hài lòng - Vai trò Người phản biện- ConferenceSpace',
    description:
      'Khảo sát này dành cho người đã thử quy trình người phản biện: xem lời mời, xem bài được phân công, đọc thông tin bài báo, nhập điểm, khuyến nghị, mức độ tự tin, phản hồi và sử dụng kiểm tra phản biện bằng AI nếu có.\n\nMục tiêu là đo mức độ hài lòng, độ dễ sử dụng, độ rõ ràng, tính năng AI thông minh và các điểm cần cải thiện của hệ thống.',
    confirmationMessage: 'Cảm ơn bạn đã giúp đánh giá ConferenceSpace.',
    items: [
      {
        type: 'MULTIPLE_CHOICE',
        title:
          'Tôi hiểu rằng khảo sát này là tự nguyện và dùng để đánh giá trải nghiệm của tôi với ConferenceSpace.',
        required: true,
        choices: [{ value: 'Có, tôi đồng ý tiếp tục' }, { value: 'Không, tôi không muốn tham gia' }]
      },
      {
        type: 'MULTIPLE_CHOICE',
        id: 'anonymous_mode',
        title: MODE_QUESTION_TITLE,
        required: true,
        choices: [{ value: ANONYMOUS_CHOICE }, { value: CONTACT_CHOICE }]
      },
      {
        type: 'PAGE_BREAK',
        id: 'email_section',
        title: 'Trang thông tin liên hệ'
      },
      {
        type: 'TEXT',
        id: 'contact_email',
        title: EMAIL_QUESTION_TITLE,
        required: false
      },
      {
        type: 'PAGE_BREAK',
        id: 'role_section',
        title: 'Thông tin vai trò'
      },
      {
        type: 'MULTIPLE_CHOICE',
        title: 'Bạn hiện là ai trong môi trường học thuật/nghiên cứu?',
        hasOtherOption: true,
        choices: [
          { value: 'Sinh viên đại học' },
          { value: 'Học viên cao học / nghiên cứu sinh' },
          { value: 'Giảng viên / nhà nghiên cứu' },
          { value: 'Nhân sự quản lý học thuật / thư ký khoa học' },
          { value: 'Người làm trong doanh nghiệp có tham gia hội nghị khoa học' }
        ]
      },
      {
        type: 'CHECKBOX',
        title:
          'Vị trí chuyên môn của bạn trong các hội nghị thường tham gia là gì (hoặc vị trí tương đương)?',
        helpText: 'Ví dụ: General Chair, PC Member, Tác giả, Subreviewer...',
        hasOtherOption: true,
        choices: [
          { value: 'General Chair / PC Chair / Ban tổ chức' },
          { value: 'Track Chair / Session Chair' },
          { value: 'Program Committee (PC) Member / Reviewer' },
          { value: 'Author / Subreviewer' },
          { value: 'Listener / Khách mời tham dự' },
          { value: 'Không có vị trí cụ thể' }
        ]
      },
      {
        type: 'PAGE_BREAK',
        id: 'main_survey_start',
        title: 'Thông tin sử dụng'
      },
      {
        type: 'MULTIPLE_CHOICE',
        title: 'Bạn đã sử dụng vai trò này trong khoảng bao lâu trước khi trả lời?',
        choices: [
          { value: 'Dưới 5 phút' },
          { value: '5-10 phút' },
          { value: '11-20 phút' },
          { value: 'Hơn 20 phút' }
        ]
      },
      {
        type: 'MULTIPLE_CHOICE',
        title:
          'Trước đây bạn đã từng sử dụng hệ thống nộp bài, phản biện hoặc quản lý hội nghị nào khác chưa?',
        choices: [{ value: 'Có' }, { value: 'Không' }]
      },
      {
        type: 'CHECKBOX',
        title: 'Bạn đã thử những phần nào trong vai trò Người phản biện?',
        hasOtherOption: true,
        choices: [
          { value: 'Hiểu trách nhiệm từ lời mời và danh sách phân công' },
          { value: 'Mở và xem thông tin bài báo được phân công' },
          { value: 'Đọc tóm tắt, metadata và thông tin hỗ trợ phản biện' },
          { value: 'Nhập điểm theo các tiêu chí đánh giá' },
          { value: 'Chọn khuyến nghị và mức độ tự tin' },
          { value: 'Nhập phản hồi bằng văn bản' },
          { value: 'Lưu bản nháp và gửi bài phản biện' },
          { value: 'Sử dụng hoặc hiểu phần kiểm tra bài phản biện bằng AI' }
        ]
      },
      {
        type: 'PAGE_BREAK',
        title: 'Mức độ hài lòng tổng thể'
      },
      {
        type: 'GRID',
        title: 'Bạn hài lòng ở mức nào với các khía cạnh sau?',
        rows: [
          'Trải nghiệm tổng thể khi sử dụng ConferenceSpace',
          'Tốc độ hoàn thành tác vụ chính',
          'Độ rõ ràng của bố cục và điều hướng',
          'Độ dễ hiểu của nhãn, nút bấm và thông báo',
          'Mức độ đầy đủ của thông tin được hiển thị',
          'Mức độ tin cậy của trạng thái, xác nhận và phản hồi từ hệ thống',
          'Thiết kế giao diện và khả năng đọc thông tin',
          'Sự phù hợp của hệ thống với quy trình hội nghị học thuật'
        ],
        columns: [
          'Rất không hài lòng',
          'Không hài lòng',
          'Bình thường',
          'Hài lòng',
          'Rất hài lòng'
        ]
      },
      {
        type: 'GRID',
        title: 'Các thao tác chính dễ hay khó đối với bạn?',
        rows: [
          'Tìm đúng màn hình hoặc chức năng cần dùng',
          'Hiểu bước tiếp theo cần làm',
          'Hoàn thành tác vụ mà không cần hướng dẫn thêm',
          'Nhận biết lỗi, cảnh báo hoặc trường bắt buộc',
          'Quay lại hoặc sửa thông tin khi cần'
        ],
        columns: ['Rất khó', 'Khó', 'Bình thường', 'Dễ', 'Rất dễ']
      },
      {
        type: 'MULTIPLE_CHOICE',
        title: 'Nếu phải cho điểm mức độ hài lòng tổng thể, bạn sẽ chọn mức nào?',
        required: true,
        choices: [
          { value: '1 - Rất không hài lòng' },
          { value: '2 - Không hài lòng' },
          { value: '3 - Bình thường' },
          { value: '4 - Hài lòng' },
          { value: '5 - Rất hài lòng' }
        ]
      },
      {
        type: 'PAGE_BREAK',
        title: 'Mức độ hài lòng theo vai trò Người phản biện'
      },
      {
        type: 'GRID',
        title: 'Bạn hài lòng ở mức nào với các phần sau trong vai trò Người phản biện?',
        rows: [
          'Hiểu trách nhiệm từ lời mời và danh sách phân công',
          'Mở và xem thông tin bài báo được phân công',
          'Đọc tóm tắt, metadata và thông tin hỗ trợ phản biện',
          'Nhập điểm theo các tiêu chí đánh giá',
          'Chọn khuyến nghị và mức độ tự tin',
          'Nhập phản hồi bằng văn bản',
          'Lưu bản nháp và gửi bài phản biện',
          'Sử dụng hoặc hiểu phần kiểm tra bài phản biện bằng AI'
        ],
        columns: [
          'Rất không hài lòng',
          'Không hài lòng',
          'Bình thường',
          'Hài lòng',
          'Rất hài lòng'
        ]
      },
      {
        type: 'GRID',
        title: 'Vui lòng đánh giá các nhận định sau.',
        rows: [
          'Lời mời phản biện và danh sách phân công giúp tôi hiểu rõ việc cần làm.',
          'Biểu mẫu phản biện hỗ trợ đánh giá bài báo theo nhiều tiêu chí.',
          'Các trường điểm số, khuyến nghị, mức độ tự tin và phản hồi kết hợp với nhau hợp lý.',
          'Thông tin bài báo và thanh bên hỗ trợ tốt cho quá trình phản biện.',
          'Phần kiểm tra phản biện bằng AI giống hướng dẫn hữu ích hơn là áp lực.',
          'Phản hồi từ AI giúp tôi cải thiện độ rõ ràng, bằng chứng hoặc tính nhất quán.',
          'Tôi cảm thấy tự tin khi lưu bản nháp hoặc gửi bài phản biện.'
        ],
        columns: [
          'Hoàn toàn không đồng ý',
          'Không đồng ý',
          'Trung lập',
          'Đồng ý',
          'Hoàn toàn đồng ý'
        ]
      },
      {
        type: 'PAGE_BREAK',
        title: 'Độ rõ ràng và khả năng sử dụng'
      },
      {
        type: 'GRID',
        title: 'Vui lòng đánh giá các nhận định về khả năng sử dụng sau.',
        rows: [
          'Tôi hiểu mục đích của từng màn hình chính trong vai trò Người phản biện.',
          'Các thông tin quan trọng được đặt ở vị trí dễ thấy.',
          'Tôi không bị quá tải bởi lượng thông tin trên màn hình.',
          'Các trạng thái, hạn chót và hành động cần làm được thể hiện rõ.',
          'Tôi có thể phục hồi khi nhập sai hoặc chưa chắc cần làm gì tiếp theo.',
          'Ngôn ngữ trong hệ thống phù hợp với người dùng sinh viên.',
          'Tôi sẽ cảm thấy thoải mái khi sử dụng vai trò này trong một môn học hoặc dự án nghiên cứu thực tế.'
        ],
        columns: [
          'Hoàn toàn không đồng ý',
          'Không đồng ý',
          'Trung lập',
          'Đồng ý',
          'Hoàn toàn đồng ý'
        ]
      },
      {
        type: 'PAGE_BREAK',
        title: 'Niềm tin và trải nghiệm với AI'
      },
      {
        type: 'GRID',
        title: 'Vui lòng đánh giá các nhận định về AI sau.',
        rows: [
          'Tôi nhận biết được khi một tính năng đang sử dụng hỗ trợ từ AI.',
          'Gợi ý của AI được trình bày như sự hỗ trợ, không phải quyết định cuối cùng.',
          'Nền tảng cung cấp đủ lý do hoặc bằng chứng cho gợi ý của AI.',
          'Kết quả từ AI giúp giảm thao tác thủ công hoặc tiết kiệm thời gian.',
          'Cảnh báo hoặc khuyến nghị của AI được viết bằng ngôn ngữ dễ hiểu.',
          'Tôi cảm thấy thoải mái khi bỏ qua hoặc đặt nghi vấn về gợi ý của AI.',
          'Tôi muốn hệ thống hiển thị nguồn, lý do hoặc mức độ tin cậy cho gợi ý AI.',
          'Tôi tin rằng quyết định học thuật cuối cùng vẫn nên do con người kiểm soát.',
          'Tôi sẽ tin tưởng AI hơn nếu hệ thống cảnh báo rõ khi kết quả có thể chưa đầy đủ hoặc không chắc chắn.'
        ],
        columns: [
          'Hoàn toàn không đồng ý',
          'Không đồng ý',
          'Trung lập',
          'Đồng ý',
          'Hoàn toàn đồng ý'
        ]
      },
      {
        type: 'PAGE_BREAK',
        title: 'Ưu tiên cải thiện'
      },
      {
        type: 'MULTIPLE_CHOICE',
        title: 'Tính năng hoặc khu vực nào hữu ích nhất với bạn?',
        hasOtherOption: true,
        choices: [
          { value: 'Lời mời phản biện' },
          { value: 'Danh sách bài được phân công' },
          { value: 'Trang thông tin bài báo' },
          { value: 'Biểu mẫu nhập điểm' },
          { value: 'Khuyến nghị và mức độ tự tin' },
          { value: 'Phản hồi bằng văn bản' },
          { value: 'Lưu bản nháp' },
          { value: 'Gửi bài phản biện' },
          { value: 'AI kiểm tra bài phản biện' },
          { value: 'Thảo luận hoặc phản biện lại' },
          { value: 'Không có tính năng nào nổi bật' }
        ]
      },
      {
        type: 'MULTIPLE_CHOICE',
        title: 'Tính năng hoặc khu vực nào cần cải thiện nhất?',
        hasOtherOption: true,
        choices: [
          { value: 'Lời mời phản biện' },
          { value: 'Danh sách bài được phân công' },
          { value: 'Trang thông tin bài báo' },
          { value: 'Biểu mẫu nhập điểm' },
          { value: 'Khuyến nghị và mức độ tự tin' },
          { value: 'Phản hồi bằng văn bản' },
          { value: 'Lưu bản nháp' },
          { value: 'Gửi bài phản biện' },
          { value: 'AI kiểm tra bài phản biện' },
          { value: 'Thảo luận hoặc phản biện lại' },
          { value: 'Không có tính năng nào nổi bật' }
        ]
      },
      {
        type: 'CHECKBOX',
        title: 'Điều gì sẽ làm bạn hài lòng hơn với hệ thống?',
        hasOtherOption: true,
        choices: [
          { value: 'Điều hướng rõ hơn' },
          { value: 'Ít bước thao tác hơn' },
          { value: 'Thông báo lỗi dễ hiểu hơn' },
          { value: 'Trạng thái và xác nhận rõ hơn' },
          { value: 'Giao diện dễ đọc hơn' },
          { value: 'Tốc độ phản hồi nhanh hơn' },
          { value: 'Giải thích AI rõ hơn' },
          { value: 'Có thêm bằng chứng hoặc nguồn cho gợi ý AI' },
          { value: 'Dễ bỏ qua hoặc chỉnh sửa gợi ý AI hơn' },
          { value: 'Không có điều cụ thể' }
        ]
      },
      {
        type: 'MULTIPLE_CHOICE',
        title: 'Có phần nào khiến bạn không thoải mái không?',
        choices: [{ value: 'Không' }, { value: 'Có' }]
      },
      {
        type: 'MULTIPLE_CHOICE',
        title: 'Nếu có điều khiến bạn không thoải mái, lý do chính là gì?',
        choices: [
          { value: 'Yêu cầu quá nhiều thông tin cá nhân' },
          { value: 'Không rõ dữ liệu được sử dụng như thế nào' },
          { value: 'AI đưa ra phản hồi quá mạnh hoặc gây áp lực' },
          { value: 'Lo ngại gợi ý AI sai' },
          { value: 'Quá nhiều trường bắt buộc' },
          { value: 'Đánh giá học thuật là vấn đề nhạy cảm' },
          { value: 'Khác' },
          { value: 'Không có điều gì gây khó chịu' }
        ]
      },
      {
        type: 'MULTIPLE_CHOICE',
        title:
          'Bạn có sẵn sàng giới thiệu hệ thống này cho bạn cùng lớp hoặc đồng nghiệp dùng thử không?',
        choices: [
          { value: 'Chắc chắn không' },
          { value: 'Có lẽ không' },
          { value: 'Không chắc' },
          { value: 'Có lẽ có' },
          { value: 'Chắc chắn có' }
        ]
      },
      {
        type: 'PAGE_BREAK',
        title: 'Góp ý cuối cùng'
      },
      {
        type: 'PARAGRAPH_TEXT',
        title: 'Điều bạn hài lòng nhất khi sử dụng ConferenceSpace là gì?',
        helpText:
          'Không bắt buộc. Vui lòng tránh nêu tên, mã số sinh viên hoặc nội dung bài báo riêng tư.'
      },
      {
        type: 'PARAGRAPH_TEXT',
        title: 'Điều quan trọng nhất cần cải thiện trước khi dùng trong thực tế là gì?',
        helpText:
          'Không bắt buộc. Vui lòng tránh nêu tên, mã số sinh viên hoặc nội dung bài báo riêng tư.'
      },
      {
        type: 'PARAGRAPH_TEXT',
        title: 'Góp ý khác không bắt buộc',
        helpText:
          'Không bắt buộc. Vui lòng tránh nêu tên, mã số sinh viên hoặc nội dung bài báo riêng tư.'
      }
    ]
  };
}
