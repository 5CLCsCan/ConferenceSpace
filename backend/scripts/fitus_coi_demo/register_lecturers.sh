#!/bin/sh
# Registers the 44 FIT@HCMUS lecturer demo accounts (password: password123).
# Run inside the backend container, e.g.:
#   ssh -i <key> ubuntu@<vm> "docker exec -i conferencespace-backend sh" < register_lecturers.sh
reg() {
  printf "%s: " "$1"
  wget -qO- --post-data="{\"user\":{\"email\":\"$1\",\"first_name\":\"$2\",\"last_name\":\"$3\",\"domain\":[\"Research\"]},\"password\":\"password123\"}" \
    --header="Content-Type: application/json" \
    http://localhost:8080/api/v1/auth/register >/dev/null 2>&1 && echo OK || echo FAIL
}
reg 'hoai.bac.le.2334258018@scholar.local' 'Lê Hoài' 'Bắc'
reg 'vu.hai.quan.2354574584@scholar.local' 'Vũ Hải' 'Quân'
reg 'bao-quoc.ho.37751314@scholar.local' 'Hồ Bảo' 'Quốc'
reg 'dien.dinh.2443135461@scholar.local' 'Đinh' 'Điền'
reg 'dinh-thuc.nguyen.2321493205@scholar.local' 'Nguyễn Đình' 'Thúc'
reg 'ly.quoc.ngoc.51378475@scholar.local' 'Lý Quốc' 'Ngọc'
reg 'thai-hoang.le.122457773@scholar.local' 'Lê Hoàng' 'Thái'
reg 'minh-triet.tran.2172507185@scholar.local' 'Trần Minh' 'Triết'
reg 'nguyen.van.vu.73551340@scholar.local' 'Nguyễn Văn' 'Vũ'
reg 'le.nguyen.hoai.nam.144080862@scholar.local' 'Lê Nguyễn Hoài' 'Nam'
reg 'dinh.ba.tien.153532808@scholar.local' 'Đinh Bá' 'Tiến'
reg 'vu.quang.lam.1840664452@scholar.local' 'Lâm Quang' 'Vũ'
reg 'thanh-duc.chau.114044022@scholar.local' 'Châu Thành' 'Đức'
reg 'le.thi.nhan.134320487@scholar.local' 'Lê Thị' 'Nhàn'
reg 'ngo.huy.bien.2210519@scholar.local' 'Ngô Huy' 'Biên'
reg 'minh-nhut.ngo.2143179051@scholar.local' 'Ngô Minh' 'Nhựt'
reg 'ha.nguyen.duc.hoang.2065240691@scholar.local' 'Nguyễn Đức Hoàng' 'Hạ'
reg 'minh-hai.nguyen.2364359033@scholar.local' 'Nguyễn Hải' 'Minh'
reg 'thao-ngoc.nguyen.1710278@scholar.local' 'Nguyễn Ngọc' 'Thảo'
reg 'thanh-phuong.nguyen.153387658@scholar.local' 'Nguyễn Thanh' 'Phương'
reg 'nhung.nguyen.thi.hong.2142222375@scholar.local' 'Nguyễn Thị Hồng' 'Nhung'
reg 'tuyen.nguyen.2116225591@scholar.local' 'Nguyễn Thị Minh' 'Tuyền'
reg 'cuong.pham-nguyen.150062801@scholar.local' 'Phạm Nguyễn' 'Cương'
reg 'tran.nguyen.minh.thu.47415183@scholar.local' 'Nguyễn Trần Minh' 'Thư'
reg 'truong.son.nguyen.2116109405@scholar.local' 'Nguyễn Trường' 'Sơn'
reg 'pham.thi.hue.2383657985@scholar.local' 'Phạm Thị Bạch' 'Huệ'
reg 'tran.thai.son.2072787948@scholar.local' 'Trần Thái' 'Sơn'
reg 'trung-dung.tran.2291027928@scholar.local' 'Trần Trung' 'Dũng'
reg 'vo.hoai.viet.50466312@scholar.local' 'Võ Hoài' 'Việt'
reg 'huy-tien.nguyen.39756439@scholar.local' 'Nguyễn Tiến' 'Huy'
reg 'toan-thinh.truong.3187061@scholar.local' 'Trương Toàn' 'Thịnh'
reg 'le.thanh.tung.2065265769@scholar.local' 'Lê Thanh' 'Tùng'
reg 'trung-nghia.le.2269907651@scholar.local' 'Lê Trung' 'Nghĩa'
reg 'my.hang.vu.thi.2162971413@scholar.local' 'Vũ Thị Mỹ' 'Hằng'
reg 'khanh-duy.le.8496903@scholar.local' 'Lê Khánh' 'Duy'
reg 'hoang-duy.tran.118099826@scholar.local' 'Trần Duy' 'Hoàng'
reg 'long.nguyen.2151126645@scholar.local' 'Nguyễn Hồng Bửu' 'Long'
reg 'ngoc-thanh.le.31367912@scholar.local' 'Lê Ngọc' 'Thành'
reg 'trung.can.102218146@scholar.local' 'Cấn Trần Thành' 'Trung'
reg 'bui.van.thach.40092120@scholar.local' 'Bùi Văn' 'Thạch'
reg 'hung.phuoc.truong.1832652@scholar.local' 'Trương Phước' 'Hưng'
reg 'hoang.le.trung.2384534773@scholar.local' 'Lê Trung' 'Hoàng'
reg 'hao.do-duc.2334237751@scholar.local' 'Đỗ Đức' 'Hào'
reg 'tuan-nam.nguyen.1706931907@scholar.local' 'Nguyễn Tuấn' 'Nam'
echo "--- done ---"
