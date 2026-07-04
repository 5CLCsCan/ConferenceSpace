const fs = require('fs');
const path = require('path');

// Hàm đọc nested value có hỗ trợ index mảng (vd: "expertise.primary_domains[0]")
const getNestedValue = (obj, pathStr) => {
  const normalizedPath = pathStr.replace(/\[(\w+)\]/g, '.$1');
  return normalizedPath.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : undefined, obj);
};

function generate() {
  const personasPath = path.join(__dirname, 'personas.json');
  const templatesDir = path.join(__dirname, 'templates');
  const outputDir = path.join(__dirname, 'generated_prompts');

  // Đọc dữ liệu
  const personas = JSON.parse(fs.readFileSync(personasPath, 'utf8'));
  const systemRules = fs.readFileSync(path.join(templatesDir, '_system_rules.md'), 'utf8');

  // Tạo thư mục đầu ra nếu chưa có
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  personas.forEach(agent => {
    const role = agent.identity.role;
    const templatePath = path.join(templatesDir, `${role}_template.md`);
    const roleTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Ghép system rules lên trước role template
    let fullPrompt = systemRules + '\n\n' + roleTemplate;
    
    // Thực hiện replace các biến {{agent.xyz}}
    fullPrompt = fullPrompt.replace(/\{\{(.*?)\}\}/g, (match, p1) => {
      const trimmedKey = p1.trim();
      
      // Chỉ replace biến agent, giữ lại biến context
      if (trimmedKey.startsWith('agent.')) {
        const valPath = trimmedKey.substring(6);
        const val = getNestedValue(agent, valPath);
        
        if (val !== undefined) {
          // Nếu là mảng hay object thì stringify
          if (typeof val === 'object') {
            return JSON.stringify(val);
          }
          return String(val);
        } else {
          console.warn(`[Warning] Không tìm thấy giá trị cho biến: ${trimmedKey} ở agent ${agent.id}`);
        }
      }
      // Trả lại nguyên vẹn nếu là {{context.*}} hoặc không khớp
      return match;
    });
    
    // Tạo tên file an toàn
    const safeName = agent.identity.display_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${agent.id}_${safeName}.md`;
    const outPath = path.join(outputDir, fileName);
    
    fs.writeFileSync(outPath, fullPrompt, 'utf8');
    console.log(`✅ Created: ${fileName}`);
  });
  
  console.log(`\n🎉 Đã tạo thành công ${personas.length} prompt files tại: ${outputDir}`);
}

generate();
