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
4. Đưa ảnh xuống dưới phần viền cửa sổ nếu muốn giữ ba chấm trạng thái ở góc trái.
5. Xóa phần chữ `UI PLACEHOLDER`, tên vai trò và tên tệp nguồn.
6. Xuất lại PDF ở đúng kích thước 1189 × 841 mm.

Không scale riêng từng chart hoặc khối chữ. Nếu cần thay đổi bố cục, chỉnh trên tệp SVG và xuất lại PDF để giữ chất lượng vector.
