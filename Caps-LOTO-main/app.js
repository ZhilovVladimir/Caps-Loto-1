document.addEventListener('DOMContentLoaded', () => {
    const tablesContainer = document.querySelector('.tables-container');

    // Создаем ключи для localStorage
    const STORAGE_KEY = 'selectedCells';
    const PREDICTION_TABLE_KEY = 'predictionTable';
    const VERIFICATION_KEY = 'verificationResults';
    const BUTTON_STATE_KEY = 'predictButtonState';

    // Функция для сохранения выбранных ячеек
    function saveSelectedCells() {
        const selectedCells = [];
        document.querySelectorAll('.number-cell').forEach((cell, index) => {
            if (cell.classList.contains('selected')) {
                const tableIndex = Math.floor(index / 20);
                const cellIndex = index % 20;
                selectedCells.push({ tableIndex, cellIndex });
            }
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedCells));

        // Сохраняем отдельно результаты проверки (таблица 1)
        const verificationCells = selectedCells.filter(cell => cell.tableIndex === 0);
        if (verificationCells.length > 0) {
            localStorage.setItem(VERIFICATION_KEY, JSON.stringify(verificationCells));
        }

        // Обновляем статистику только для архивных таблиц (2-5)
        const selectedNumbers = Array.from(document.querySelectorAll('.number-cell'))
            .filter((cell, index) => cell.classList.contains('selected') && Math.floor(index / 20) >= 1 && Math.floor(index / 20) <= 4)
            .map(cell => parseInt(cell.textContent));

        gameStatistics.updateStatistics(selectedNumbers);
        statisticsVisualizer.updateCharts(gameStatistics.getVisualizationData());
    }

    // Сохранение результата предсказания
    function savePredictionResult(prediction) {
        const predictionData = {
            leftField: prediction.slice(0, 4),  // Первые 4 числа для левого поля
            rightField: prediction.slice(4, 8), // Вторые 4 числа для правого поля
            timestamp: new Date().toISOString(),
            verified: false
        };
        localStorage.setItem(PREDICTION_TABLE_KEY, JSON.stringify(predictionData));
    }

    // Функция для загрузки сохраненных ячеек
    function loadSelectedCells() {
        // Загружаем результаты проверки (таблица 1)
        const savedVerification = localStorage.getItem(VERIFICATION_KEY);
        if (savedVerification) {
            const verificationCells = JSON.parse(savedVerification);
            const allCells = document.querySelectorAll('.number-cell');
            verificationCells.forEach(({ tableIndex, cellIndex }) => {
                const globalIndex = tableIndex * 20 + cellIndex;
                if (allCells[globalIndex]) {
                    allCells[globalIndex].classList.add('selected');
                }
            });
        }

        // Загружаем остальные выбранные ячейки
        const savedCells = localStorage.getItem(STORAGE_KEY);
        if (savedCells) {
            const selectedCells = JSON.parse(savedCells);
            const allCells = document.querySelectorAll('.number-cell');
            selectedCells.forEach(({ tableIndex, cellIndex }) => {
                const globalIndex = tableIndex * 20 + cellIndex;
                if (allCells[globalIndex] && tableIndex !== 0) {
                    allCells[globalIndex].classList.add('selected');
                }
            });
        }

        // Загружаем состояние кнопки прогноза
        const buttonState = localStorage.getItem(BUTTON_STATE_KEY);
        if (buttonState === 'disabled') {
            predictButton.disabled = true;
            predictButton.classList.add('predict-button-disabled');
        }

        // Обновляем статистику при загрузке
        const selectedNumbers = Array.from(document.querySelectorAll('.number-cell'))
            .filter((cell, index) => cell.classList.contains('selected') && Math.floor(index / 20) >= 1 && Math.floor(index / 20) <= 4)
            .map(cell => parseInt(cell.textContent));

        gameStatistics.updateStatistics(selectedNumbers);
        statisticsVisualizer.updateCharts(gameStatistics.getVisualizationData());

        // Загружаем предсказание
        loadPredictionTable();
    }

    // Загрузка предсказанных чисел в шестую таблицу
    function loadPredictionTable() {
        const savedPrediction = localStorage.getItem(PREDICTION_TABLE_KEY);
        if (savedPrediction) {
            const predictionData = JSON.parse(savedPrediction);
            const predictionTables = document.querySelectorAll('.prediction-pair .number-table');

            // Подсвечиваем предсказанные числа в левой таблице
            predictionTables[0].querySelectorAll('.number-cell').forEach(cell => {
                const num = parseInt(cell.textContent);
                if (predictionData.leftField.includes(num)) {
                    cell.classList.add('predicted');
                }
            });

            // Подсвечиваем предсказанные числа в правой таблице
            predictionTables[1].querySelectorAll('.number-cell').forEach(cell => {
                const num = parseInt(cell.textContent);
                if (predictionData.rightField.includes(num)) {
                    cell.classList.add('predicted');
                }
            });
        }
    }

    // Создаем левую колонку с 6 таблицами
    const leftColumn = document.createElement('div');
    leftColumn.className = 'tables-column';

    // Создаем правую колонку с 5 таблицами
    const rightColumn = document.createElement('div');
    rightColumn.className = 'tables-column';

    // Добавляем 6 таблиц в левую колонку
    for (let i = 0; i < 6; i++) {
        const pairWrapper = document.createElement('div');
        pairWrapper.className = 'table-pair-wrapper';
        if (i === 5) pairWrapper.classList.add('prediction-pair');

        // Добавляем номера полей сверху
        const leftNumber = document.createElement('div');
        leftNumber.className = 'table-number left';
        if (i === 0) {
            leftNumber.textContent = 'Проверка';
        } else if (i === 5) {
            leftNumber.textContent = 'Прогноз 1';
        } else {
            leftNumber.textContent = 'Архив';
        }

        const rightNumber = document.createElement('div');
        rightNumber.className = 'table-number right';
        if (i === 0) {
            rightNumber.textContent = 'Результат';
        } else if (i === 5) {
            rightNumber.textContent = 'Прогноз 2';
        } else {
            rightNumber.textContent = 'Тираж';
        }

        // Добавляем номер таблицы внизу
        const bottomNumber = document.createElement('div');
        bottomNumber.className = 'table-number-bottom';
        bottomNumber.textContent = (i + 1).toString();

        pairWrapper.appendChild(leftNumber);
        pairWrapper.appendChild(rightNumber);
        pairWrapper.appendChild(bottomNumber);

        const table1 = createTable(i === 5);
        const table2 = createTable(i === 5);

        if (i === 5) {
            table1.classList.add('prediction-table-left');
            table2.classList.add('prediction-table-right');
        }

        pairWrapper.appendChild(table1);
        pairWrapper.appendChild(table2);

        if (i < 6) {
            leftColumn.appendChild(pairWrapper);
        }
    }

    tablesContainer.appendChild(leftColumn);
    tablesContainer.appendChild(rightColumn);

    // Добавляем кнопки и секцию анализа
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'buttons-container';

    // Кнопка генерации предсказания
    const predictButton = document.createElement('button');
    predictButton.className = 'predict-button';
    predictButton.textContent = 'СГЕНЕРИРОВАТЬ ПРОГНОЗ';

    // Кнопка анализа ошибок
    const analyzeButton = document.createElement('button');
    analyzeButton.className = 'analyze-button';
    analyzeButton.textContent = 'АНАЛИЗ ТОЧНОСТИ ПРОГНОЗА';

    // Кнопка сброса
    const resetButton = document.createElement('button');
    resetButton.className = 'reset-button';
    resetButton.textContent = 'СБРОС';

    // Создаем секцию для отображения анализа
    const analysisSection = document.createElement('div');
    analysisSection.className = 'analysis-section';
    analysisSection.innerHTML = `
        <div class="analysis-content">
            <h3>Анализ прогноза</h3>
            <div class="analysis-details"></div>
        </div>
    `;

    buttonsContainer.appendChild(predictButton);
    buttonsContainer.appendChild(analyzeButton);
    buttonsContainer.appendChild(resetButton);
    buttonsContainer.appendChild(analysisSection);

    // Добавляем контейнер после таблиц
    tablesContainer.after(buttonsContainer);

    // Создаем модальное окно
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal">
                <div class="modal-text">Вы уверены, что хотите сбросить все выбранные числа?</div>
                <div class="modal-buttons">
                    <button class="modal-button confirm">Да</button>
                    <button class="modal-button cancel">Отмена</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modalOverlay = document.querySelector('.modal-overlay');
    const confirmButton = document.querySelector('.modal-button.confirm');
    const cancelButton = document.querySelector('.modal-button.cancel');

    // Обработчик для кнопки сброса
    resetButton.addEventListener('click', () => {
        modalOverlay.style.display = 'flex';
    });

    // Обработчики для кнопок модального окна
    confirmButton.addEventListener('click', () => {
        // Очищаем все ячейки
        const allCells = document.querySelectorAll('.number-cell');
        allCells.forEach(cell => {
            cell.classList.remove('selected');
            cell.classList.remove('predicted');
        });

        // Очищаем localStorage
        localStorage.clear(); // Очищаем весь localStorage

        // Сбрасываем статистику
        gameStatistics.statistics = gameStatistics.loadStatistics();
        statisticsVisualizer.updateCharts(gameStatistics.getVisualizationData());

        // Сбрасываем состояние кнопок
        predictButton.disabled = false;
        predictButton.classList.remove('predict-button-disabled');
        analyzeButton.disabled = true;
        analyzeButton.classList.add('analyze-button-disabled');

        // Скрываем секцию анализа
        const analysisSection = document.querySelector('.analysis-section');
        if (analysisSection) {
            analysisSection.style.display = 'none';
            // Очищаем содержимое анализа
            const analysisDetails = analysisSection.querySelector('.analysis-details');
            if (analysisDetails) {
                analysisDetails.innerHTML = '';
            }
        }

        modalOverlay.style.display = 'none';

        // Перезагружаем страницу для полного сброса
        window.location.reload();
    });

    // Обработчик для кнопки отмены
    cancelButton.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
    });

    // Закрытие модального окна при клике вне его
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });

    // Закрытие модального окна при нажатии Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
            modalOverlay.style.display = 'none';
        }
    });

    // Функция анализа точности прогноза
    function analyzePredictionAccuracy() {
        const predictionData = JSON.parse(localStorage.getItem(PREDICTION_TABLE_KEY));

        // Получаем все ячейки из первой пары таблиц
        const allCells = Array.from(document.querySelectorAll('.number-cell'));

        // Получаем числа из левого поля первой таблицы
        const leftVerification = allCells
            .slice(0, 20)  // Берем первые 20 ячеек первой таблицы
            .filter(cell => cell.classList.contains('selected') && parseInt(cell.textContent) >= 1 && parseInt(cell.textContent) <= 20)
            .map(cell => parseInt(cell.textContent))
            .sort((a, b) => a - b);

        // Получаем числа из правого поля первой таблицы
        const rightVerification = allCells
            .slice(20, 40)  // Берем 20 ячеек правого поля первой таблицы
            .filter(cell => cell.classList.contains('selected') && parseInt(cell.textContent) >= 1 && parseInt(cell.textContent) <= 20)
            .map(cell => parseInt(cell.textContent))
            .sort((a, b) => a - b);

        if (!predictionData || (leftVerification.length === 0 && rightVerification.length === 0)) {
            alert('Необходимо сначала сгенерировать прогноз и внести результаты тиража в таблицу проверки');
            return;
        }

        // Находим совпадения для левого поля (числа от 1 до 20)
        const leftFieldMatches = predictionData.leftField.filter(num =>
            leftVerification.includes(num) && num >= 1 && num <= 20
        ).sort((a, b) => a - b);

        // Находим совпадения для правого поля (числа от 1 до 20)
        const rightFieldMatches = predictionData.rightField.filter(num =>
            rightVerification.includes(num) && num >= 1 && num <= 20
        ).sort((a, b) => a - b);

        // Формируем детальный анализ
        const analysisDetails = document.querySelector('.analysis-details');
        analysisDetails.innerHTML = `
            <div class="match-details">
                <h4>Левое поле (совпало ${leftFieldMatches.length} число из 4):</h4>
                <p>Ваш прогноз: ${predictionData.leftField.join(', ')}</p>
                <p>Выпавшие числа: ${leftVerification.join(', ')}</p>
                <p>Совпало число: ${leftFieldMatches.length > 0 ? leftFieldMatches.join(', ') : 'нет совпадений'}</p>
            </div>
            <div class="match-details">
                <h4>Правое поле (совпало ${rightFieldMatches.length} число из 4):</h4>
                <p>Ваш прогноз: ${predictionData.rightField.join(', ')}</p>
                <p>Выпавшие числа: ${rightVerification.join(', ')}</p>
                <p>Совпало число: ${rightFieldMatches.length > 0 ? rightFieldMatches.join(', ') : 'нет совпадений'}</p>
            </div>
            <div class="accuracy-info">
                <p>Общая точность: ${((leftFieldMatches.length + rightFieldMatches.length) / 8 * 100).toFixed(1)}%</p>
                <p class="accuracy-explanation">Для выигрыша нужно угадать 4 числа в одном поле или 3+4 числа в разных полях</p>
            </div>
            <div class="recommendation">
                ${getRecommendation(leftFieldMatches.length, rightFieldMatches.length, leftVerification, rightVerification)}
            </div>
        `;

        // Показываем секцию анализа
        analysisSection.style.display = 'block';
    }

    // Функция получения рекомендаций по улучшению
    function getRecommendation(leftMatches, rightMatches, leftVerification, rightVerification) {
        const totalMatches = leftMatches + rightMatches;
        let recommendation = '<h4>Что это значит и что делать дальше:</h4>';

        if (totalMatches >= 6) {
            recommendation += `
                <p>🎯 Отличный результат! Ваш прогноз оказался очень точным.</p>
                <p>Что делать:</p>
                <ul>
                    <li>Продолжайте использовать текущую стратегию</li>
                    <li>Запишите использованный подход для будущих прогнозов</li>
                </ul>
            `;
        } else if (totalMatches >= 4) {
            recommendation += `
                <p>👍 Хороший результат! Вы близки к победе.</p>
                <p>Что можно улучшить:</p>
                <ul>
                    <li>Обратите внимание на числа, которые часто выпадают в последних тиражах (запишите их в таблицы 2-5)</li>
                    <li>Посмотрите, какие числа чаще выпадают вместе в одном поле</li>
                </ul>
            `;
        } else if (totalMatches >= 2) {
            recommendation += `
                <p>📊 Средний результат. Есть куда расти.</p>
                <p>Что нужно сделать:</p>
                <ul>
                    <li>Внесите больше результатов прошлых тиражей в таблицы 2-5</li>
                    <li>Проверьте, нет ли закономерностей в выпадении чисел (например, часто выпадают рядом стоящие числа)</li>
                    <li>Попробуйте разделить числа на группы (1-5, 6-10, 11-15, 16-20) и отследить частоту их появления</li>
                </ul>
            `;
        } else {
            recommendation += `
                <p>📝 Результат можно улучшить. Вот что поможет:</p>
                <ul>
                    <li>Заполните таблицы 2-5 результатами последних 10-20 тиражей</li>
                    <li>Отметьте для себя, какие числа выпадают чаще всего</li>
                    <li>Проверьте, есть ли числа, которые часто выпадают парами</li>
                    <li>В следующий раз попробуйте комбинировать часто выпадающие числа с случайными</li>
                </ul>
            `;
        }
        return recommendation;
    }

    // Обработчик для кнопки анализа
    analyzeButton.addEventListener('click', analyzePredictionAccuracy);

    // Обновляем обработчик для кнопки предсказания
    predictButton.addEventListener('click', () => {
        if (predictButton.disabled) return;

        const prediction = gameStatistics.generatePrediction();
        savePredictionResult(prediction);
        loadPredictionTable();

        // Блокируем кнопку прогноза и активируем кнопку анализа
        predictButton.disabled = true;
        predictButton.classList.add('predict-button-disabled');
        analyzeButton.disabled = false;
        analyzeButton.classList.remove('analyze-button-disabled');

        localStorage.setItem(BUTTON_STATE_KEY, 'disabled');

        // Добавляем анимацию для кнопки
        predictButton.classList.add('predict-button-active');
        setTimeout(() => {
            predictButton.classList.remove('predict-button-active');
        }, 500);
    });

    // Функция создания таблицы
    function createTable(isPredictionTable = false) {
        const table = document.createElement('div');
        table.className = 'number-table';
        if (isPredictionTable) {
            table.classList.add('prediction-table');
        }

        // Создаем ячейки с числами
        for (let i = 1; i <= 20; i++) {
            const cell = document.createElement('div');
            cell.className = 'number-cell';
            cell.textContent = i;

            // Добавляем обработчик клика
            cell.addEventListener('click', () => {
                if (!isPredictionTable) {
                    cell.classList.toggle('selected');
                    saveSelectedCells();
                }
            });

            table.appendChild(cell);
        }

        return table;
    }

    // Загружаем сохраненные ячейки после создания всех таблиц
    setTimeout(loadSelectedCells, 0);
}); 