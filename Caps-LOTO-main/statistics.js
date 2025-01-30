class GameStatistics {
	constructor() {
		this.STORAGE_KEY = 'gameStatistics';
		this.statistics = this.loadStatistics();
	}

	// Загрузка статистики из localStorage
	loadStatistics() {
		const saved = localStorage.getItem(this.STORAGE_KEY);
		return saved ? JSON.parse(saved) : {
			numberFrequency: {},      // Частота выпадения чисел
			hotNumbers: [],           // Горячие числа
			coldNumbers: [],          // Холодные числа
			evenOddRatio: {           // Соотношение четных/нечетных
				even: 0,
				odd: 0
			},
			sumStatistics: {          // Статистика сумм
				min: 0,
				max: 0,
				average: 0
			},
			pairFrequency: {},        // Частота парных комбинаций
			lastUpdate: null          // Время последнего обновления
		};
	}

	// Сохранение статистики
	saveStatistics() {
		localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.statistics));
	}

	// Обновление статистики на основе выбранных чисел
	updateStatistics(selectedNumbers) {
		// Обновляем частоту чисел
		selectedNumbers.forEach(num => {
			this.statistics.numberFrequency[num] = (this.statistics.numberFrequency[num] || 0) + 1;
		});

		// Обновляем горячие и холодные числа
		this.updateHotColdNumbers();

		// Обновляем соотношение четных/нечетных
		this.updateEvenOddRatio(selectedNumbers);

		// Обновляем статистику сумм
		this.updateSumStatistics(selectedNumbers);

		// Обновляем частоту парных комбинаций
		this.updatePairFrequency(selectedNumbers);

		// Обновляем время последнего обновления
		this.statistics.lastUpdate = new Date().toISOString();

		this.saveStatistics();
	}

	// Обновление горячих и холодных чисел
	updateHotColdNumbers() {
		const frequencies = Object.entries(this.statistics.numberFrequency);
		frequencies.sort((a, b) => b[1] - a[1]);

		this.statistics.hotNumbers = frequencies.slice(0, 5).map(pair => parseInt(pair[0]));
		this.statistics.coldNumbers = frequencies.slice(-5).map(pair => parseInt(pair[0]));
	}

	// Обновление соотношения четных/нечетных
	updateEvenOddRatio(numbers) {
		const evenCount = numbers.filter(num => num % 2 === 0).length;
		const oddCount = numbers.length - evenCount;

		this.statistics.evenOddRatio.even += evenCount;
		this.statistics.evenOddRatio.odd += oddCount;
	}

	// Обновление статистики сумм
	updateSumStatistics(numbers) {
		const sum = numbers.reduce((acc, num) => acc + num, 0);
		const stats = this.statistics.sumStatistics;

		if (!stats.min || sum < stats.min) stats.min = sum;
		if (!stats.max || sum > stats.max) stats.max = sum;

		// Обновление среднего значения
		const totalSums = (stats.average * this.getTotalGames()) + sum;
		stats.average = totalSums / (this.getTotalGames() + 1);
	}

	// Обновление частоты парных комбинаций
	updatePairFrequency(numbers) {
		for (let i = 0; i < numbers.length; i++) {
			for (let j = i + 1; j < numbers.length; j++) {
				const pair = `${numbers[i]}-${numbers[j]}`;
				this.statistics.pairFrequency[pair] = (this.statistics.pairFrequency[pair] || 0) + 1;
			}
		}
	}

	// Получение общего количества игр
	getTotalGames() {
		const frequencies = Object.values(this.statistics.numberFrequency);
		return frequencies.length > 0 ? Math.max(...frequencies) : 0;
	}

	// Генерация предполагаемых выигрышных комбинаций
	generatePrediction() {
		// Генерируем предсказания для обоих полей
		const leftField = this.generateFieldPrediction();
		const rightField = this.generateFieldPrediction();

		return [...leftField, ...rightField];
	}

	// Генерация предсказания для одного поля (4 числа)
	generateFieldPrediction() {
		const prediction = [];
		const hotNumbers = [...this.statistics.hotNumbers];

		// Добавляем 2 горячих числа
		while (prediction.length < 2 && hotNumbers.length > 0) {
			const number = hotNumbers.shift();
			if (!prediction.includes(number)) {
				prediction.push(number);
			}
		}

		// Добавляем 2 числа из средней частоты
		const mediumFrequencyNumbers = this.getMediumFrequencyNumbers();
		while (prediction.length < 4 && mediumFrequencyNumbers.length > 0) {
			const randomIndex = Math.floor(Math.random() * mediumFrequencyNumbers.length);
			const number = mediumFrequencyNumbers.splice(randomIndex, 1)[0];
			if (!prediction.includes(number)) {
				prediction.push(number);
			}
		}

		// Если не хватает чисел, добавляем случайные из оставшихся
		while (prediction.length < 4) {
			const number = Math.floor(Math.random() * 20) + 1;
			if (!prediction.includes(number)) {
				prediction.push(number);
			}
		}

		return prediction.sort((a, b) => a - b);
	}

	// Получение чисел со средней частотой выпадения
	getMediumFrequencyNumbers() {
		const frequencies = Object.entries(this.statistics.numberFrequency)
			.map(([num, freq]) => ({ num: parseInt(num), freq }))
			.sort((a, b) => b.freq - a.freq);

		const middleIndex = Math.floor(frequencies.length / 2);
		return frequencies
			.slice(middleIndex - 4, middleIndex + 4)
			.map(item => item.num);
	}

	// Получение статистики для визуализации
	getVisualizationData() {
		return {
			frequencies: this.statistics.numberFrequency,
			hotNumbers: this.statistics.hotNumbers,
			coldNumbers: this.statistics.coldNumbers,
			evenOddRatio: this.statistics.evenOddRatio,
			sumStatistics: this.statistics.sumStatistics,
			pairFrequency: this.statistics.pairFrequency,
			lastUpdate: this.statistics.lastUpdate
		};
	}
}

// Создаем и экспортируем экземпляр класса
const gameStatistics = new GameStatistics(); 