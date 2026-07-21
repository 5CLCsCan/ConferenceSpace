# Thiết kế hai poster ConferenceSpace

## Mục tiêu

Tạo hai poster A0 ngang chất lượng in từ cùng nội dung đã khóa, khác nhau về chiến lược kể chuyện nhưng thống nhất về dữ liệu, màu sắc và ngôn ngữ thị giác của ConferenceSpace.

## Đầu ra

Mỗi phiên bản có ba định dạng:

- SVG chỉnh sửa được, giữ text, diagram và chart ở dạng vector.
- PDF một trang đúng 1189 × 841 mm, dùng để in.
- PNG độ phân giải cao 9362 × 6622 px, dùng để xem và chia sẻ.

## Phiên bản A — Product Journey

- Dải đầu chứa logo, tên đề tài, thành viên và giảng viên hướng dẫn.
- Cột trái giới thiệu vấn đề, mục tiêu và mô hình ba lớp trách nhiệm.
- Khu vực giữa kể hành trình theo ba vai trò: Tác giả, Phản biện viên, Chủ tọa.
- Ba placeholder UI lớn gắn với ba vai trò, có tên tệp đề xuất để thay ảnh.
- Cột phải trình bày bốn cụm bằng chứng và một cảnh báo nổi bật cho Review Quality Auditor.
- Dải cuối chứa kết luận, giới hạn và thông điệp “con người giữ quyền quyết định”.

Phiên bản này tối ưu cho phần trình bày 15 phút: người nói có thể đi từ trái sang phải mà không phải quay lại poster.

## Phiên bản B — Evidence Dashboard

- Dải đầu tối giản, nhấn mạnh tên ConferenceSpace và luận điểm trung tâm.
- Mô hình ba lớp nằm ở trung tâm như bản đồ trách nhiệm.
- Các cụm đánh giá bao quanh mô hình theo bốn nguồn bằng chứng: backend, thuật toán, AI và UAT.
- Biểu đồ vector chiếm diện tích lớn hơn; placeholder UI đặt thành dải sản phẩm ở đáy.
- Giới hạn được trình bày như một panel “Phạm vi kết luận” thay vì chú thích rời.

Phiên bản này tối ưu cho hội đồng đọc độc lập và kiểm tra quan hệ giữa luận điểm, bằng chứng và giới hạn.

## Hệ thống thị giác chung

- Primary `#1B3C53`, secondary `#234C6A`, accent `#456882`.
- Background `#F8FAFC`, card `#FFFFFF`, border `#DBDBDB`.
- Success `#16A34A`, warning `#F59E0B`, risk `#EF4444`.
- Inter cho nội dung và số liệu; Georgia dùng như serif display gần Merriweather cho tiêu đề lớn.
- Góc bo vừa phải, đường viền mảnh, bóng rất nhẹ; không dùng gradient trang trí.
- Diagram và chart dùng cùng độ dày nét, bán kính góc và hệ màu với UI platform.

## Biểu đồ

- Backend: ba thanh p95 117,6 / 71,8 / 79,3 ms với ngưỡng 120 ms.
- Reviewer ranking: Hit@1 / Hit@5 / Hit@10 của Jaccard, overlap count và random.
- AI evidence: các metric được nhóm theo tác vụ, không gộp thành một “độ chính xác AI”.
- UAT/Chatbot: dùng số tuyệt đối kèm mẫu số, tránh biểu đồ tròn khó so sánh.
- Review Quality Auditor 46,99% được thể hiện như tín hiệu cảnh báo, không phải thành tích.

## Placeholder UI

- Khung tỷ lệ gần 16:9, nền sáng, viền nét đứt và nhãn vai trò.
- Ghi rõ tên ảnh nguồn đề xuất ngay trong khung.
- Placeholder không raster hóa vào SVG; người dùng có thể thay bằng `<image>` hoặc chèn ảnh trong phần mềm vector.

## Kiểm định

- Kiểm tra đúng kích thước trang bằng `pdfinfo`/`pypdf`.
- Render lại PDF bằng Poppler và xem ảnh PNG để phát hiện tràn, chồng chữ hoặc tương phản kém.
- Kiểm tra tất cả con số bắt buộc có trong SVG.
- Không sử dụng biểu đồ cũ có số liệu xung đột với phần tổng kết Chương 4/5.
