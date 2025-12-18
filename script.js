document.addEventListener('DOMContentLoaded', function() {
    // ===== НАВИГАЦИЯ =====
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
    
    // ===== СИМУЛЯТОР =====
    // Элементы управления
    const tempSlider = document.getElementById('tempSlider');
    const tempValue = document.getElementById('tempValue');
    const pressureSelect = document.getElementById('pressureSelect');
    const oilTypeSelect = document.getElementById('oilType');
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const exportBtn = document.getElementById('exportBtn');
    const statusText = document.getElementById('statusText');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const panelStatus = document.getElementById('panelStatus');
    
    // Визуальные элементы
    const crudeOil = document.getElementById('crudeOil');
    const flame = document.getElementById('flame');
    const currentTemp = document.getElementById('currentTemp');
    const currentTempDisplay = document.getElementById('currentTempDisplay');
    const currentPressure = document.getElementById('currentPressure');
    const inletValve = document.getElementById('inletValve');
    
    // Продукты
    const productLiquids = {
        gases: document.getElementById('productGases'),
        gasoline: document.getElementById('productGasoline'),
        naphtha: document.getElementById('productNaphtha'),
        diesel: document.getElementById('productDiesel'),
        residue: document.getElementById('productResidue')
    };
    
    const productYields = {
        gases: document.getElementById('yieldGases'),
        gasoline: document.getElementById('yieldGasoline'),
        naphtha: document.getElementById('yieldNaphtha'),
        diesel: document.getElementById('yieldDiesel'),
        residue: document.getElementById('yieldResidue')
    };
    
    const fractionElements = document.querySelectorAll('.fraction');
    const resultsTable = document.querySelector('#resultsTable tbody');
    
    // Сводки
    const summaryOilType = document.getElementById('summaryOilType');
    const summaryTemp = document.getElementById('summaryTemp');
    const summaryYield = document.getElementById('summaryYield');
    
    // Данные нефти
    const oilData = {
        light: {
            name: "Легкая нефть",
            baseYields: { gases: 8, gasoline: 30, naphtha: 20, diesel: 32, residue: 10 },
            color: "#d4a574"
        },
        heavy: {
            name: "Тяжелая нефть",
            baseYields: { gases: 5, gasoline: 18, naphtha: 12, diesel: 25, residue: 40 },
            color: "#2d3436"
        }
    };
    
    // Температурные диапазоны
    const fractionTemps = {
        gases: { min: 0, max: 40 },
        gasoline: { min: 40, max: 180 },
        naphtha: { min: 180, max: 250 },
        diesel: { min: 250, max: 350 },
        residue: { min: 350, max: 600 }
    };
    
    // Применение
    const fractionUses = {
        gases: "Топливо, полимеры, водород",
        gasoline: "Автомобильное топливо",
        naphtha: "Сырьё для нефтехимии",
        diesel: "Топливо для грузовиков",
        residue: "Котельное топливо, битум"
    };
    
    // Состояние
    let isRunning = false;
    let currentOil = oilData.heavy;
    let currentProcessTemp = 20;
    let currentYields = { ...currentOil.baseYields };
    
    // ===== ИНИЦИАЛИЗАЦИЯ =====
    function init() {
        if (tempSlider && tempValue) {
            tempValue.textContent = `${tempSlider.value}°C`;
            tempSlider.addEventListener('input', updateTempDisplay);
        }
        
        if (pressureSelect && currentPressure) {
            pressureSelect.addEventListener('change', updatePressureDisplay);
            updatePressureDisplay();
        }
        
        if (oilTypeSelect) {
            oilTypeSelect.addEventListener('change', updateOilType);
            updateOilDisplay();
        }
        
        if (startBtn) {
            startBtn.addEventListener('click', startProcess);
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', resetProcess);
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', exportResults);
        }
        
        updateResultsTable();
        updateSummary();
    }
    
    // ===== ОБНОВЛЕНИЕ ДИСПЛЕЕВ =====
    function updateTempDisplay() {
        const temp = parseInt(tempSlider.value);
        if (tempValue) tempValue.textContent = `${temp}°C`;
        if (summaryTemp) summaryTemp.textContent = `${temp}°C`;
    }
    
    function updatePressureDisplay() {
        if (currentPressure) {
            const pressureMode = pressureSelect.value === 'vacuum' ? 'Вакуумный' : 'Атмосферный';
            currentPressure.textContent = pressureMode;
        }
    }
    
    function updateOilType() {
        currentOil = oilData[oilTypeSelect.value];
        currentYields = { ...currentOil.baseYields };
        updateOilDisplay();
        updateSummary();
        updateResultsTable();
    }
    
    function updateOilDisplay() {
        if (crudeOil) {
            crudeOil.style.background = `linear-gradient(to top, ${currentOil.color}, ${currentOil.color}99)`;
        }
        if (summaryOilType) {
            summaryOilType.textContent = currentOil.name;
        }
    }
    
    // ===== РАСЧЕТЫ =====
    function calculateYieldsBasedOnTemp(temp) {
        const baseYields = currentOil.baseYields;
        const tempFactor = temp / 350;
        
        currentYields = {
            gases: calculateFractionYield('gases', temp, baseYields.gases, tempFactor),
            gasoline: calculateFractionYield('gasoline', temp, baseYields.gasoline, tempFactor),
            naphtha: calculateFractionYield('naphtha', temp, baseYields.naphtha, tempFactor),
            diesel: calculateFractionYield('diesel', temp, baseYields.diesel, tempFactor),
            residue: calculateFractionYield('residue', temp, baseYields.residue, tempFactor)
        };
        
        normalizeYields();
        updateProductYields();
        updateSummary();
    }
    
    function calculateFractionYield(fraction, temp, baseYield, tempFactor) {
        const fractionTemp = fractionTemps[fraction];
        
        if (temp >= fractionTemp.max) {
            return baseYield;
        } else if (temp <= fractionTemp.min) {
            return baseYield * 0.1;
        } else {
            const fractionProgress = (temp - fractionTemp.min) / (fractionTemp.max - fractionTemp.min);
            return baseYield * fractionProgress;
        }
    }
    
    function normalizeYields() {
        let total = 0;
        Object.values(currentYields).forEach(yield => total += yield);
        
        if (total > 0) {
            const factor = 100 / total;
            for (let key in currentYields) {
                currentYields[key] = Math.round(currentYields[key] * factor);
            }
        }
    }
    
    function updateProductYields() {
        for (const [product, element] of Object.entries(productYields)) {
            if (element) {
                element.textContent = `${currentYields[product]}%`;
            }
        }
    }
    
    function updateSummary() {
        let totalYield = 0;
        Object.values(currentYields).forEach(yield => totalYield += yield);
        
        if (summaryYield) {
            summaryYield.textContent = `${totalYield}%`;
        }
    }
    
    // ===== ПРОЦЕСС СИМУЛЯЦИИ =====
    function startProcess() {
        if (isRunning) return;
        
        isRunning = true;
        updateStatus("Процесс запущен...", "#2ecc71");
        if (panelStatus) panelStatus.textContent = "В работе";
        
        // Анимация клапана
        if (inletValve) inletValve.classList.add('open');
        
        // Анимация пламени
        if (flame) {
            flame.classList.add('active');
            flame.style.opacity = "1";
        }
        
        const targetTemp = parseInt(tempSlider.value);
        calculateYieldsBasedOnTemp(targetTemp);
        
        // Нагрев
        currentProcessTemp = 20;
        const tempInterval = setInterval(() => {
            if (currentProcessTemp < targetTemp) {
                currentProcessTemp += 5;
                
                if (currentTemp) currentTemp.textContent = `${currentProcessTemp}°C`;
                if (currentTempDisplay) currentTempDisplay.textContent = `${currentProcessTemp}°C`;
                
                // Изменение пламени
                if (flame) {
                    if (currentProcessTemp > 300) {
                        flame.classList.add('very-hot');
                        flame.classList.remove('hot');
                    } else if (currentProcessTemp > 200) {
                        flame.classList.add('hot');
                    }
                }
                
                // Обновление выходов
                if (currentProcessTemp % 20 === 0) {
                    calculateYieldsBasedOnTemp(currentProcessTemp);
                }
            } else {
                clearInterval(tempInterval);
                startDistillation();
            }
        }, 50);
    }
    
    function startDistillation() {
        updateStatus("Идет перегонка...", "#3498db");
        
        // Слив нефти
        if (crudeOil) {
            crudeOil.style.height = "0%";
        }
        
        // Прогресс бар
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 2;
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressText) progressText.textContent = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                finishProcess();
            }
        }, 100);
        
        // Заполнение колонны
        fractionElements.forEach((fraction, index) => {
            const fractionType = fraction.dataset.fraction;
            const yield = currentYields[fractionType] || 0;
            
            setTimeout(() => {
                fraction.style.height = `${yield}%`;
            }, 300 * (index + 1));
        });
        
        // Заполнение продуктов
        setTimeout(() => {
            for (const [product, element] of Object.entries(productLiquids)) {
                const yield = currentYields[product] || 0;
                if (element) {
                    element.style.height = `${yield}%`;
                }
            }
        }, 1500);
        
        updateResultsTable();
    }
    
    function finishProcess() {
        isRunning = false;
        updateStatus("Процесс завершен!", "#2ecc71");
        if (panelStatus) panelStatus.textContent = "Завершен";
        
        // Сброс анимаций
        if (flame) {
            flame.classList.remove('active', 'hot', 'very-hot');
            flame.style.opacity = "0";
        }
        
        if (inletValve) {
            inletValve.classList.remove('open');
        }
        
        // Результаты
        const pressureMode = pressureSelect.value === 'vacuum' ? 'вакуумной' : 'атмосферной';
        const targetTemp = parseInt(tempSlider.value);
        const totalYield = Object.values(currentYields).reduce((a, b) => a + b, 0);
        
        setTimeout(() => {
            alert(`✅ Перегонка успешно завершена!\n\n` +
                  `📊 Результаты:\n` +
                  `• Тип нефти: ${currentOil.name}\n` +
                  `• Режим: ${pressureMode}\n` +
                  `• Температура: ${targetTemp}°C\n` +
                  `• Общий выход: ${totalYield}%\n\n` +
                  `🎯 Продукты готовы к сбору.`);
        }, 500);
    }
    
    function resetProcess() {
        if (isRunning) return;
        
        isRunning = false;
        currentProcessTemp = 20;
        currentYields = { ...currentOil.baseYields };
        
        // Сброс дисплеев
        updateStatus("Ожидание запуска", "#7f8c8d");
        if (panelStatus) panelStatus.textContent = "Готов к работе";
        
        if (currentTemp) currentTemp.textContent = "20°C";
        if (currentTempDisplay) currentTempDisplay.textContent = "20°C";
        if (progressFill) progressFill.style.width = "0%";
        if (progressText) progressText.textContent = "0%";
        
        // Сброс визуальных элементов
        if (crudeOil) {
            crudeOil.style.height = "80%";
        }
        
        if (flame) {
            flame.classList.remove('active', 'hot', 'very-hot');
            flame.style.opacity = "0";
        }
        
        if (inletValve) {
            inletValve.classList.remove('open');
        }
        
        // Сброс продуктов
        for (const element of Object.values(productLiquids)) {
            if (element) element.style.height = "0%";
        }
        
        fractionElements.forEach(fraction => {
            fraction.style.height = "0%";
        });
        
        updateProductYields();
        updateSummary();
        updateResultsTable();
    }
    
    function updateStatus(text, color) {
        if (statusText) {
            statusText.textContent = text;
            statusText.style.color = color;
        }
    }
    
    // ===== ТАБЛИЦА РЕЗУЛЬТАТОВ =====
    function updateResultsTable() {
        if (!resultsTable) return;
        
        resultsTable.innerHTML = '';
        
        const productInfo = {
            gases: { name: "Газы", formula: "C₁-C₄", temp: "< 40°C" },
            gasoline: { name: "Бензин", formula: "C₅-C₁₁", temp: "40-180°C" },
            naphtha: { name: "Нафта", formula: "Сырьё", temp: "180-250°C" },
            diesel: { name: "Дизель", formula: "C₁₂-C₂₀", temp: "250-350°C" },
            residue: { name: "Мазут", formula: ">C₂₀", temp: "> 350°C" }
        };
        
        for (const [product, info] of Object.entries(productInfo)) {
            const row = document.createElement('tr');
            const yield = currentYields[product] || 0;
            
            row.innerHTML = `
                <td>
                    <strong>${info.name}</strong><br>
                    <small>${info.formula}</small>
                </td>
                <td>${info.temp}</td>
                <td><span class="yield-value">${yield}%</span></td>
                <td>${fractionUses[product]}</td>
            `;
            
            resultsTable.appendChild(row);
        }
    }
    
    function exportResults() {
        const data = {
            oilType: currentOil.name,
            temperature: tempSlider.value,
            pressure: pressureSelect.value === 'vacuum' ? 'Вакуум' : 'Атмосфера',
            yields: currentYields,
            timestamp: new Date().toLocaleString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `нефтепереработка_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ Результаты экспортированы в JSON файл');
    }
    
    // ===== ГЛАДКАЯ ПРОКРУТКА =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
    init();
    
    // ===== АНИМАЦИИ ПРИ ПРОКРУТКЕ =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.card, .timeline-item, .gallery-card').forEach(el => {
        observer.observe(el);
    });
    
    // ===== ДОБАВЛЕНИЕ СТИЛЕЙ ДЛЯ АНИМАЦИЙ =====
    const style = document.createElement('style');
    style.textContent = `
        .yield-value {
            font-weight: bold;
            color: #2ecc71;
            background: rgba(46, 204, 113, 0.1);
            padding: 5px 10px;
            border-radius: 20px;
            display: inline-block;
        }
        
        .card, .timeline-item, .gallery-card {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .card.animated, .timeline-item.animated, .gallery-card.animated {
            opacity: 1;
            transform: translateY(0);
        }
        
        .card:nth-child(2) { transition-delay: 0.1s; }
        .card:nth-child(3) { transition-delay: 0.2s; }
        .card:nth-child(4) { transition-delay: 0.3s; }
        .timeline-item:nth-child(2) { transition-delay: 0.2s; }
        .timeline-item:nth-child(3) { transition-delay: 0.4s; }
    `;
    document.head.appendChild(style);
});