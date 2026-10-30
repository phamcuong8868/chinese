document.body.insertAdjacentHTML("beforeend", `
<div id="menuScreen" class="menuScreen">
    <center>
        <span style="font-weight: bold; font-size: 20px;">214 bộ thủ Khang Hy</span><br>
        <span style="font-weight:500">(dạng chữ Khải thư)</span>
    </center>  
        
    <div class="menu__container">
        <div class="menu__button" onclick="document.getElementById('menuScreen').style.display='none';chooseRandom();">
            Học từng bộ thủ
        </div>

         <div class="menu__button" onclick="document.getElementById('test').style.display='block';">
            Làm trắc nghiệm
        </div>
    </div>
    <p class="foot">Lưu ý về thuật ngữ: Khang Hy (康熙) là hệ thống 214 bộ thủ được dùng trong Từ điển Khang Hy; Khải thư (楷書) là kiểu chữ viết chuẩn hiện đại. “Bộ thủ Khang Hy” là tên hệ thống phân loại, không có nghĩa cả 214 bộ đều được sáng tạo vào thời Khang Hy.</p>
    <p class="foot">Nguồn tham khảo nền tảng: Unicode Standard, mục “Kangxi danhSachBoThu and CJK danhSachBoThu Supplement” — xác nhận khối Kangxi danhSachBoThu gồm 214 bộ và phân biệt dạng bộ thủ với chữ Hán tương ứng.</p>

    
</div>`);