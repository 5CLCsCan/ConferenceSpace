# Thay ảnh UI trong poster

Hai tệp SVG dùng ba nhóm placeholder có `id` ổn định:

- `ui-placeholder-author`
- `ui-placeholder-reviewer`
- `ui-placeholder-chair`

Mỗi nhóm có thuộc tính `data-replace-with` chỉ ra ảnh nguồn được đề xuất.

## Trong Figma, Illustrator hoặc Inkscape

1. Mở tệp SVG tương ứng.
2. Tìm nhóm placeholder theo `id` hoặc chọn trực tiếp khung nét đứt.
3. Đặt ảnh thật lên đúng khung và crop theo tỷ lệ hiện có.
4. Đưa ảnh xuống dưới đường viền nét đứt và crop kín vùng placeholder.
5. Xóa phần chữ `UI PLACEHOLDER`, tên vai trò và tên tệp nguồn.
6. Xuất lại PDF ở đúng kích thước 1189 × 841 mm.

Không scale riêng từng chart hoặc khối chữ. Nếu cần thay đổi bố cục, chỉnh trên tệp SVG và xuất lại PDF để giữ chất lượng vector.

Typography của bản nguồn dùng Tahoma cho nội dung và Cambria cho tiêu đề; hai họ chữ đều hỗ trợ đầy đủ dấu tiếng Việt. Khi mở trong công cụ thiết kế, không thay thế bằng font thiếu bộ ký tự Latin mở rộng.
