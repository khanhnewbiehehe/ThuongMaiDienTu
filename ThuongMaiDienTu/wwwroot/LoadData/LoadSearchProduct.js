$(document).ready(function () {    // Get search parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('searchTerm') || '';
    const categoryId = parseInt(urlParams.get('categoryId')) || 0;
    const minPrice = parseFloat(urlParams.get('minPrice')) || 0;
    // Handle empty maxPrice or 0 value as no upper limit
    const maxPrice = urlParams.get('maxPrice') ? (parseFloat(urlParams.get('maxPrice')) || 0) : '';
    const page = parseInt(urlParams.get('page')) || 1;
    const pageSize = parseInt(urlParams.get('pageSize')) || 12;
      // Get status filter values, default to true if not specified
    const launchGoing = urlParams.get('LaunchGoing') !== 'false';
    const launchFull = urlParams.get('LaunchFull') !== 'false';
    const launchEnded = urlParams.get('LaunchEnded') !== 'false';

    // Call function to load search products
    LoadSearchProducts(searchTerm, categoryId, minPrice, maxPrice, launchGoing, launchFull, launchEnded, page, pageSize);// We'll remove the click handler for price-range as we're using the slider now    
    // Handle click on active filters "x" icon to remove that filter
    $(document).on('click', '.badge .bi-x', function() {
        const badge = $(this).closest('.badge');
        if (badge.text().includes('Search:')) {
            $('input[name="searchTerm"]').val('');
        } else if (badge.text().includes('Category:')) {
            $('input[id="category-0"]').prop('checked', true);
        } else if (badge.text().includes('Giá:')) {
            // Reset price range filter
            $('input[name="minPrice"]').val(0);
            $('input[name="maxPrice"]').val('');
            $('#priceOption-all').prop('checked', true);
            $('#priceOption-custom').prop('checked', false);
            
            // If noUiSlider is initialized, reset it
            const slider = document.getElementById('price-range-slider');
            if (slider && slider.noUiSlider) {
                slider.noUiSlider.set([0, 20000000]);
            }        } else if (badge.text().includes('Trạng thái:')) {
            // Reset status filters - check all status checkboxes
            $('#status-all').prop('checked', true);
            $('#status-ongoing').prop('checked', true);
            $('#status-full').prop('checked', true);
            $('#status-ended').prop('checked', true);
            // Add hidden inputs for true values
            $('input[name="LaunchGoing"]').val(true);
            $('input[name="LaunchFull"]').val(true);
            $('input[name="LaunchEnded"]').val(true);
        }
        $('#searchForm').submit();
    });
});

function LoadSearchProducts(searchTerm, categoryId, minPrice, maxPrice, launchGoing, launchFull, launchEnded, page, pageSize) {    $.ajax({
        url: '/Customer/Search/GetFilteredProducts',
        type: 'GET',
        data: {
            searchTerm: searchTerm,
            categoryId: categoryId,
            minPrice: minPrice,
            maxPrice: maxPrice,
            LaunchGoing: launchGoing,
            LaunchFull: launchFull,
            LaunchEnded: launchEnded,
            page: page,
            pageSize: pageSize
        },
        dataType: 'json',
        success: function (response) {
            const list = $('#list_search_product');
            list.empty();

            // Create row container for products
            let currentRow;            // Display products in a grid layout (3 products per row)            // Apply client-side status filtering for better UX
            const filteredData = response.data.filter(item => {
                const now = new Date().getTime();
                const endTime = new Date(item.end).getTime();
                const isEnded = endTime <= now;
                const isFull = item.registration >= item.quantity;
                
                // Only show products that match the selected status filters
                return (isEnded && launchEnded) || 
                       (isFull && !isEnded && launchFull) || 
                       (!isFull && !isEnded && launchGoing);
            });
            
            // Update results count
            $('#results-count').text(`${filteredData.length} Results found`);
            
            filteredData.forEach(function (item, index) {
                // Create a new row for every 3 products
                if (index % 3 === 0) {
                    currentRow = $('<div class="row mb-4"></div>');
                    list.append(currentRow);
                }

                // Create column for the product card
                const column = $('<div class="col-md-4 mb-4"></div>');
                
                // Determine badge status based on time and registration
                let badgeHtml = '';
                const now = new Date().getTime();
                const endTime = new Date(item.end).getTime();
                const isEnded = endTime <= now;
                const isFull = item.registration >= item.quantity;
                
                if (isEnded) {
                    badgeHtml = '<div class="position-absolute top-0 start-0 bg-danger text-white px-2 py-1" style="background-color: #EE5858 !important; z-index: 1;">KẾT THÚC</div>';
                } else if (isFull) {
                    badgeHtml = '<div class="position-absolute top-0 start-0 text-dark px-2 py-1" style="background-color: #EFD33D !important; z-index: 1;">ĐÃ ĐẦY</div>';
                } else {
                    // Create a unique countdown ID for each product
                    const countdownId = `search-countdown-${index}`;
                    badgeHtml = `
                        <div class="position-absolute top-0 start-0 bg-light px-2 py-1" style="z-index: 1;">
                            <small class="d-flex align-items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 512 512">
                                    <path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
                                </svg>
                                <span id="${countdownId}" data-end="${item.end}"></span>
                            </small>
                        </div>
                    `;
                }

                // Create product card with styling similar to the image
                const card = `
                    <div class="card h-100 position-relative" style="border-radius: 8px; overflow: hidden;">
                        ${badgeHtml}
                        <div class="position-relative" style="height: 220px; overflow: hidden;">
                            <img src="${item.imageUrl}" alt="${item.name}" class="card-img-top" style="object-fit: cover; height: 100%; width: 100%;">
                            <div class="position-absolute top-0 bottom-0 start-0 end-0 d-flex justify-content-center align-items-center bg-dark bg-opacity-50 opacity-0" style="transition: opacity 0.3s ease; z-index: 1;">
                                <a onClick="CreateFavourite(${item.id})" class="btn btn-light btn-sm me-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 512 512">
                                        <path d="M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8l0-3.3c0-70.4 50-130.8 119.2-144C158.6 37.9 198.9 47 231 69.6c9 6.4 17.4 13.8 25 22.3c4.2-4.8 8.7-9.2 13.5-13.3c3.7-3.2 7.5-6.2 11.5-9c0 0 0 0 0 0C313.1 47 353.4 37.9 392.8 45.4C462 58.6 512 119.1 512 189.5l0 3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9z" />
                                    </svg>
                                </a>
                                <a href="/Product/Details/${item.id}" class="btn btn-light btn-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 576 512">
                                        <path d="M288 80c-65.2 0-118.8 29.6-159.9 67.7C89.6 183.5 63 226 49.4 256c13.6 30 40.2 72.5 78.6 108.3C169.2 402.4 222.8 432 288 432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256c-13.6-30-40.2-72.5-78.6-108.3C406.8 109.6 353.2 80 288 80z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                        <div class="card-body">                            <h6 class="card-title text-truncate">${item.name}</h6>
                            <p class="card-text fw-bold text-primary mb-2">${item.min.toLocaleString('vi-VN')}₫ - ${item.max.toLocaleString('vi-VN')}₫</p>
                            <div class="progress" style="height: 8px;">
                                <div class="progress-bar progress-bar-striped" 
                                     role="progressbar" 
                                     title="${item.registration}/${item.quantity}"
                                     style="width: ${Math.min((item.registration*100/item.quantity), 100)}%;" 
                                     aria-valuenow="${item.registration}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="${item.quantity}">
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                column.html(card);
                currentRow.append(column);
            });            // Add empty message if no products found
            if (filteredData.length === 0) {
                list.html('<div class="alert alert-info">Không tìm thấy sản phẩm nào phù hợp với điều kiện tìm kiếm.</div>');
            }

            // Add hover effect to product cards
            $('.card').hover(
                function() {
                    $(this).find('.bg-dark').removeClass('opacity-0');
                },
                function() {
                    $(this).find('.bg-dark').addClass('opacity-0');
                }
            );            // Update countdowns every second
            updateCountdowns();
            
            // Add pagination if needed
            if (filteredData.length > 0 && response.total > pageSize) {
                const totalPages = Math.ceil(response.total / pageSize);
                const paginationContainer = $('<nav aria-label="Page navigation" class="mt-4"><ul class="pagination justify-content-center"></ul></nav>');
                const paginationList = paginationContainer.find('ul');
                
                // Previous button
                paginationList.append(`
                    <li class="page-item ${page <= 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${parseInt(page) - 1}" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
                `);
                
                // Page numbers
                for (let i = 1; i <= totalPages; i++) {
                    paginationList.append(`
                        <li class="page-item ${i == page ? 'active' : ''}">
                            <a class="page-link" href="#" data-page="${i}">${i}</a>
                        </li>
                    `);
                }
                
                // Next button
                paginationList.append(`
                    <li class="page-item ${page >= totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" data-page="${parseInt(page) + 1}" aria-label="Next">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                `);
                
                // Add pagination to the DOM
                list.append(paginationContainer);                // Handle pagination clicks
                $('.pagination .page-link').on('click', function(e) {
                    e.preventDefault();
                    if (!$(this).parent().hasClass('disabled')) {
                        const newPage = $(this).data('page');
                        LoadSearchProducts(searchTerm, categoryId, minPrice, maxPrice, launchGoing, launchFull, launchEnded, newPage, pageSize);
                    }
                });
            }
        },        error: function (xhr, status, error) {
            console.error('Error loading search products:', error);
            console.error('Status:', status);
            console.error('Response:', xhr.responseText);
            
            let errorMessage = 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.';
            if (xhr.status === 404) {
                errorMessage = 'Không tìm thấy đường dẫn API. Vui lòng kiểm tra lại cấu hình.';
            } else if (xhr.status === 500) {
                errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
            }
            
            $('#list_search_product').html(`<div class="alert alert-danger">${errorMessage} (Status: ${xhr.status})</div>`);
        }
    });
}

// Function to update all countdowns
function updateCountdowns() {
    const countdownTimer = setInterval(function() {
        $('[id^=search-countdown-]').each(function() {
            const endTime = new Date($(this).data('end')).getTime();
            const now = new Date().getTime();
            const distance = endTime - now;

            if (distance <= 0) {
                $(this).closest('.card').find('.position-absolute.top-0.start-0')
                    .removeClass('bg-light')
                    .addClass('bg-danger')
                    .css('background-color', '#EE5858 !important')
                    .html('KẾT THÚC');
                
                // If all countdowns are finished, clear the interval
                if ($('[id^=search-countdown-]').length === $('[id^=search-countdown-]:contains("Đã kết thúc")').length) {
                    clearInterval(countdownTimer);
                }
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                $(this).text(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            }
        });
    }, 1000);
}

// Reuse existing CreateFavourite function from LoadProduct.js
function CreateFavourite(id) {
    $.ajax({
        url: `/Guest/Favourite/${id}`,
        type: 'POST',
        success: function (data) {
            if (data.redirect) {
                Swal.fire({
                    title: 'Yêu cầu đăng nhập',
                    text: data.message || 'Vui lòng đăng nhập trước khi thêm vào yêu thích.',
                    icon: 'warning',
                    confirmButtonText: 'Đăng nhập'
                }).then(() => {
                    window.location.href = data.redirect;
                });
            } else if (data.success && data.forwardTo) {
                // Nếu được xác nhận là customer, gọi tiếp API thực hiện tạo
                $.ajax({
                    url: data.forwardTo,
                    type: 'POST',
                    success: function (res) {
                        if (res.success) {
                            Swal.fire({
                                title: 'Thành công!',
                                text: res.message || 'Đã thêm vào danh sách yêu thích.',
                                icon: 'success',
                                confirmButtonText: 'OK'
                            });
                        } else {
                            Swal.fire({
                                title: 'Thất bại!',
                                text: res.message || 'Không thể thêm vào yêu thích.',
                                icon: 'error',
                                confirmButtonText: 'OK'
                            });
                        }
                    },
                    error: function () {
                        Swal.fire({
                            title: 'Lỗi!',
                            text: 'Đã xảy ra lỗi khi gửi yêu cầu.',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                });
            } else {
                Swal.fire({
                    title: 'Không thể thực hiện',
                    text: data.message || 'Hành động không hợp lệ.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        },
        error: function () {
            Swal.fire({
                title: 'Lỗi!',
                text: 'Đã xảy ra lỗi khi gửi yêu cầu.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    });
}