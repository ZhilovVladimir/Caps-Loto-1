class StatisticsVisualizer {
	constructor() {
		this.charts = {};
		this.loadStoredData(); // Загружаем сохраненные данные при создании
		this.initializeCharts();
	}

	// Инициализация графиков
	initializeCharts() {
		// Создаем контейнер для статистики
		const statsContainer = document.createElement('div');
		statsContainer.className = 'statistics-container';
		document.querySelector('.container').appendChild(statsContainer);

		// Создаем секции для разных типов графиков
		const sections = [
			{ id: 'frequency', title: 'Частота выпадения чисел' },
			{ id: 'hotCold', title: 'Горячие и холодные числа' },
			{ id: 'evenOdd', title: 'Чётные/Нечётные' },
			{ id: 'sumTrend', title: 'Тренд сумм' }
		];

		sections.forEach(section => {
			const sectionElement = this.createChartSection(section.id, section.title);
			statsContainer.appendChild(sectionElement);
		});

		// Добавляем секцию предсказаний
		const predictionSection = this.createPredictionSection();
		statsContainer.appendChild(predictionSection);

		// Инициализируем графики после создания DOM элементов
		this.initializeChartInstances();
	}

	// Создание секции для графика
	createChartSection(id, title) {
		const section = document.createElement('div');
		section.className = 'chart-section';

		const header = document.createElement('h2');
		header.textContent = title;
		header.className = 'chart-title';

		const canvas = document.createElement('canvas');
		canvas.id = id + 'Chart';

		section.appendChild(header);
		section.appendChild(canvas);

		return section;
	}

	// Создание секции предсказаний
	createPredictionSection() {
		const section = document.createElement('div');
		section.className = 'prediction-section';

		const header = document.createElement('h2');
		header.textContent = 'Предсказанные комбинации';
		header.className = 'chart-title';

		const predictionDisplay = document.createElement('div');
		predictionDisplay.id = 'predictionDisplay';
		predictionDisplay.className = 'prediction-display';

		const updateButton = document.createElement('button');
		updateButton.textContent = 'Обновить предсказание';
		updateButton.className = 'update-prediction-button';
		updateButton.onclick = () => this.updatePrediction();

		section.appendChild(header);
		section.appendChild(predictionDisplay);
		section.appendChild(updateButton);

		return section;
	}

	// Инициализация экземпляров графиков
	initializeChartInstances() {
		const commonOptions = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false
				}
			}
		};

		// График частоты
		this.charts.frequency = new Chart(document.getElementById('frequencyChart'), {
			type: 'bar',
			data: {
				labels: Array.from({ length: 20 }, (_, i) => i + 1),
				datasets: [{
					label: 'Частота',
					data: Array(20).fill(0),
					backgroundColor: 'rgba(54, 162, 235, 0.5)',
					borderColor: 'rgba(54, 162, 235, 1)',
					borderWidth: 1
				}]
			},
			options: {
				...commonOptions,
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							color: 'rgba(255, 255, 255, 0.7)',
							font: {
								size: 10
							}
						}
					},
					x: {
						ticks: {
							color: 'rgba(255, 255, 255, 0.7)',
							font: {
								size: 10
							}
						}
					}
				}
			}
		});

		// График горячих и холодных чисел
		this.charts.hotCold = new Chart(document.getElementById('hotColdChart'), {
			type: 'bar',
			data: {
				labels: ['Горячие', 'Холодные'],
				datasets: [{
					label: 'Частота',
					data: [0, 0],
					backgroundColor: [
						'rgba(255, 99, 132, 0.5)',
						'rgba(75, 192, 192, 0.5)'
					],
					borderColor: [
						'rgba(255, 99, 132, 1)',
						'rgba(75, 192, 192, 1)'
					],
					borderWidth: 1
				}]
			},
			options: {
				...commonOptions,
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							color: 'rgba(255, 255, 255, 0.7)',
							font: {
								size: 10
							}
						}
					},
					x: {
						ticks: {
							color: 'rgba(255, 255, 255, 0.7)',
							font: {
								size: 10
							}
						}
					}
				}
			}
		});

		// График четных/нечетных
		this.charts.evenOdd = new Chart(document.getElementById('evenOddChart'), {
			type: 'doughnut',
			data: {
				labels: ['Чётные', 'Нечётные'],
				datasets: [{
					data: [0, 0],
					backgroundColor: [
						'rgba(255, 206, 86, 0.5)',
						'rgba(153, 102, 255, 0.5)'
					],
					borderColor: [
						'rgba(255, 206, 86, 1)',
						'rgba(153, 102, 255, 1)'
					],
					borderWidth: 1
				}]
			},
			options: {
				...commonOptions,
				plugins: {
					legend: {
						display: true,
						position: 'bottom',
						labels: {
							color: 'rgba(255, 255, 255, 0.7)',
							font: {
								size: 10
							}
						}
					}
				}
			}
		});

		// График тренда сумм
		this.charts.sumTrend = new Chart(document.getElementById('sumTrendChart'), {
			type: 'line',
			data: {
				labels: [],
				datasets: [{
					label: 'Сумма',
					data: [],
					fill: false,
					borderColor: 'rgba(75, 192, 192, 1)',
					tension: 0.1
				}]
			},
			options: {
				...commonOptions,
				scales: {
					y: {
						ticks: {
							color: 'rgba(255, 255, 255, 0.7)',
							font: {
								size: 10
							}
						}
					},
					x: {
						ticks: {
							color: 'rgba(255, 255, 255, 0.7)',
							font: {
								size: 10
							}
						}
					}
				}
			}
		});
	}

	// Добавляем новый метод для загрузки данных
	loadStoredData() {
		const storedData = localStorage.getItem('lotoStatistics');
		if (storedData) {
			this.statisticsData = JSON.parse(storedData);
		} else {
			this.statisticsData = {
				frequencies: {},
				hotNumbers: [],
				coldNumbers: [],
				evenOddRatio: { even: 0, odd: 0 },
				sumStatistics: { average: 0 },
				predictions: []
			};
		}
	}

	// Модифицируем метод updateCharts
	updateCharts(data) {
		// Сохраняем новые данные
		this.statisticsData = {
			frequencies: data.frequencies,
			hotNumbers: data.hotNumbers,
			coldNumbers: data.coldNumbers,
			evenOddRatio: data.evenOddRatio,
			sumStatistics: data.sumStatistics,
			predictions: this.statisticsData.predictions || []
		};

		// Сохраняем в localStorage
		localStorage.setItem('lotoStatistics', JSON.stringify(this.statisticsData));

		// Обновление графика частоты
		this.charts.frequency.data.datasets[0].data = Array.from({ length: 20 }, (_, i) =>
			data.frequencies[i + 1] || 0
		);
		this.charts.frequency.update();

		// Обновление графика горячих и холодных чисел
		const hotAvg = data.hotNumbers.reduce((acc, num) => acc + (data.frequencies[num] || 0), 0) / data.hotNumbers.length;
		const coldAvg = data.coldNumbers.reduce((acc, num) => acc + (data.frequencies[num] || 0), 0) / data.coldNumbers.length;
		this.charts.hotCold.data.datasets[0].data = [hotAvg, coldAvg];
		this.charts.hotCold.update();

		// Обновление графика четных/нечетных
		this.charts.evenOdd.data.datasets[0].data = [
			data.evenOddRatio.even,
			data.evenOddRatio.odd
		];
		this.charts.evenOdd.update();

		// Обновление графика тренда сумм
		if (data.sumStatistics.average > 0) {
			this.charts.sumTrend.data.labels.push(new Date().toLocaleTimeString());
			this.charts.sumTrend.data.datasets[0].data.push(data.sumStatistics.average);
			if (this.charts.sumTrend.data.labels.length > 10) {
				this.charts.sumTrend.data.labels.shift();
				this.charts.sumTrend.data.datasets[0].data.shift();
			}
			this.charts.sumTrend.update();
		}
	}

	// Модифицируем метод updatePrediction
	updatePrediction() {
		const prediction = gameStatistics.generatePrediction();

		// Сохраняем предсказание в историю
		this.statisticsData.predictions.push({
			numbers: prediction,
			timestamp: new Date().toISOString()
		});

		// Ограничиваем историю последними 50 предсказаниями
		if (this.statisticsData.predictions.length > 50) {
			this.statisticsData.predictions.shift();
		}

		// Сохраняем обновленные данные
		localStorage.setItem('lotoStatistics', JSON.stringify(this.statisticsData));

		const predictionDisplay = document.getElementById('predictionDisplay');
		predictionDisplay.innerHTML = `
			<div class="prediction-numbers">
				${prediction.map(num => `<span class="prediction-number">${num}</span>`).join('')}
			</div>
			<div class="prediction-info">
				<p>Последнее обновление: ${new Date().toLocaleTimeString()}</p>
				<p>Всего сохранено предсказаний: ${this.statisticsData.predictions.length}</p>
			</div>
		`;
	}

	// Добавляем метод для очистки статистики
	clearStatistics() {
		if (confirm('Вы уверены, что хотите очистить всю статистику?')) {
			localStorage.removeItem('lotoStatistics');
			this.loadStoredData();
			this.updateCharts(this.statisticsData);
		}
	}
}

// Создаем и экспортируем экземпляр класса
const statisticsVisualizer = new StatisticsVisualizer(); 