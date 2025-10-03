# Bot Quản Lý Nợ (Doino Bot)

## Tính năng: Ghi nhận Order

**As a** User (Người dùng đặt đồ)
**I want to** sử dụng lệnh `*order`
**So that** đơn hàng của tôi được ghi nhận vào danh sách nợ.

## Tính năng: Xác định Chủ Nợ

**As a** Bot (Doino Bot)
**I want to** tự động xác định người cuối cùng trong danh sách `*report` là chủ nợ của ngày hôm đó
**So that** việc quản lý nợ được phân công rõ ràng.

## Tính năng: Quản lý Order của Chủ Nợ

**As a** Chủ nợ
**I want to** có thể đánh dấu order của user là "đã thanh toán" (done)
**So that** tôi có thể dễ dàng theo dõi các khoản nợ đã được trả.

**As a** Chủ nợ
**I want to** có thể đánh dấu order là "đã thanh toán" bằng cách react (biểu tượng cảm xúc) vào tin nhắn order hoặc gõ lệnh
**So that** việc xác nhận thanh toán trở nên tiện lợi.

## Tính năng: Cấu hình tần suất nhắc nhở trả nợ

**As a** Chủ nợ
**I want to** có thể cấu hình tần suất bot sẽ nhắc nhở các con nợ
**So that** tôi có thể chủ động trong việc thu hồi nợ (ví dụ: 5 phút, 10 phút, hàng ngày).

## Tính năng: Nhắc nhở trả nợ tự động

**As a** Chủ nợ
**I want to** gọi lệnh như `*doino @<tên_user>` hoặc `*doino all` với tần suất mong muốn (ví dụ: `*doino @Hien Thanh Nguyen 5p` hoặc `*doino all 10p`)
**So that** bot tự động ping những người chưa trả nợ theo tần suất đã đặt.

**As a** Bot (Doino Bot)
**I want to** tự động gửi tin nhắn nhắc nhở (DM) đến người dùng đã được chỉ định khi đến hạn hoặc theo tần suất cấu hình
**So that** người dùng được thông báo về khoản nợ của họ.

## Tính năng: Báo cáo nợ

**As a** Chủ nợ
**I want to** có thể yêu cầu bot in ra một bản báo cáo nợ
**So that** tôi có cái nhìn tổng quan về các khoản nợ tồn đọng.

**As a** Chủ nợ
**I want to** có thể chọn định dạng cho bản báo cáo
**So that** báo cáo phù hợp với nhu cầu của tôi (ví dụ: báo cáo cuối tháng).

**As a** Chủ nợ
**I want to** có thể nhập số tiền cho từng order
**So that** báo cáo nợ hiển thị chính xác số tiền mà mỗi user đang nợ.

## Tính năng: Yêu cầu xác nhận đã trả nợ (Optional)

**As a** Người nợ
**I want to** sử dụng lệnh `*request-tra-no`
**So that** tôi có thể thông báo cho chủ nợ rằng tôi đã thanh toán.

**As a** Chủ nợ
**I want to** có thể xác nhận các yêu cầu trả nợ từ người nợ (bằng react hoặc lệnh)
**So that** khoản nợ được cập nhật trạng thái và được tính vào báo cáo cuối tháng.

## Tính năng: Xem báo cáo trên Web (Future)

**As a** Chủ nợ
**I want to** có một giao diện web để xem và quản lý các báo cáo nợ
**So that** việc theo dõi và tổng hợp dữ liệu trở nên dễ dàng và trực quan hơn.

---

Bạn có muốn tôi tạo một biểu đồ đơn giản minh họa luồng hoạt động của bot không?

### **Các lệnh dành cho người dùng (User):**

1.  **`*order [nội dung order]`**

    - **Mô tả:** Ghi nhận một đơn hàng mới vào danh sách nợ.
    - **Ví dụ:** `*order 1 trà sữa trân châu đường đen`
    - **Ghi chú:** Có thể không cần số tiền ở bước này, chủ nợ sẽ nhập sau.

2.  **`*request-paid`** (hoặc `*request-tra-no`)

    - **Mô tả:** Gửi yêu cầu đến chủ nợ để xác nhận rằng user đã thanh toán khoản nợ của mình.
    - **Ví dụ:** `*request-paid`
    - **Ghi chú:** Chủ nợ sẽ nhận được thông báo và xác nhận (bằng react hoặc lệnh).

3.  **`*mydebts`**
    - **Mô tả:** Xem danh sách các khoản nợ hiện tại của bản thân.
    - **Ví dụ:** `*mydebts`

---

### **Các lệnh dành cho chủ nợ (Creditor):**

1.  **`*report`**

    - **Mô tả:** Hiển thị danh sách các khoản nợ hiện có, bao gồm người nợ, nội dung order và trạng thái. Người cuối cùng trong danh sách sẽ được tự động chỉ định là chủ nợ hiện tại (nếu chức năng này được triển khai).
    - **Ví dụ:** `*report`

2.  **`*done @[tên_user] [mã_order]`**

    - **Mô tả:** Đánh dấu một order cụ thể của một user là đã thanh toán. Mã order có thể là số thứ tự trong báo cáo hoặc ID riêng.
    - **Ví dụ:** `*done @Hien Thanh Nguyen 3` (đánh dấu order thứ 3 của Hiền đã xong)
    - **Ghi chú:** Ngoài ra, có thể dùng React vào tin nhắn order gốc.

3.  **`*set-amount @[tên_user] [mã_order] [số_tiền]`**

    - **Mô tả:** Nhập hoặc cập nhật số tiền cho một order cụ thể của một user.
    - **Ví dụ:** `*set-amount @Hien Thanh Nguyen 3 35000`

4.  **`*doino @[tên_user] [tần_suất]`**

    - **Mô tả:** Kích hoạt bot tự động nhắc nhở một user cụ thể trả nợ theo tần suất định sẵn.
    - **Ví dụ:** `*doino @Hien Thanh Nguyen 5m` (nhắc nhở Hiền mỗi 5 phút)
    - **Tần suất:** `m` (phút), `h` (giờ), `d` (ngày). Mặc định nếu không có tần suất có thể là một lần hoặc theo config chung.

5.  **`*doino all [tần_suất]`**

    - **Mô tả:** Kích hoạt bot tự động nhắc nhở _tất cả_ những người đang nợ theo tần suất định sẵn.
    - **Ví dụ:** `*doino all 10m` (nhắc nhở tất cả mỗi 10 phút)

6.  **`*stop-doino @[tên_user]`** (hoặc `*stop-doino all`)

    - **Mô tả:** Dừng việc nhắc nhở trả nợ cho một user cụ thể hoặc tất cả user.
    - **Ví dụ:** `*stop-doino @Hien Thanh Nguyen`

7.  **`*config-frequency [tần_suất_mặc_định]`**

    - **Mô tả:** Cấu hình tần suất nhắc nhở mặc định cho bot khi không có tần suất cụ thể được chỉ định trong lệnh `*doino`.
    - **Ví dụ:** `*config-frequency 1h`

8.  **`*confirm-paid @[tên_user] [mã_order_hoặc_all]`**

    - **Mô tả:** Xác nhận rằng một user đã thanh toán. Có thể dùng để xác nhận `*request-paid`.
    - **Ví dụ:** `*confirm-paid @Hien Thanh Nguyen all` (xác nhận Hiền đã trả hết nợ)

9.  **`*set-creditor @[tên_user]`** (hoặc `*set-owner`)

    - **Mô tả:** Chỉ định một người dùng cụ thể làm chủ nợ (trong trường hợp không tự động từ `*report` hoặc muốn thay đổi).
    - **Ví dụ:** `*set-creditor @Ten nè 🍬`

10. **`*clear-all-debts @[tên_user]`** (hoặc `*clear-all-debts all`)
    - **Mô tả:** Xóa tất cả các khoản nợ của một user cụ thể hoặc tất cả các khoản nợ trong hệ thống.
    - **Cảnh báo:** Lệnh này cần được sử dụng cẩn thận.

---

//TODO:
Tim cach query va tracking message order theo form
