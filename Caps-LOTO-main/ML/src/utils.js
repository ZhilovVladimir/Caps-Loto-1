const fs = require('fs-extra');
const path = require('path');

class MLUtils {
	/**
	 * Нормализация данных для нейронной сети
	 * @param {number[]} numbers - Массив чисел для нормализации
	 * @param {number} maxValue - Максимальное значение (по умолчанию 20)
	 * @returns {number[]} Нормализованный массив
	 */
	static normalizeNumbers(numbers, maxValue = 20) {
		return numbers.map(num => num / maxValue);
	}

	/**
	 * Денормализация данных
	 * @param {number[]} normalizedNumbers - Нормализованный массив
	 * @param {number} maxValue - Максимальное значение (по умолчанию 20)
	 * @returns {number[]} Денормализованный массив
	 */
	static denormalizeNumbers(normalizedNumbers, maxValue = 20) {
		return normalizedNumbers.map(num => Math.round(num * maxValue));
	}

	/**
	 * Подготовка данных для обучения
	 * @param {Array} data - Исходные данные
	 * @returns {Array} Подготовленные данные для обучения
	 */
	static prepareTrainingData(data) {
		return data.map(record => ({
			input: this.normalizeNumbers(record.numbers),
			output: record.nextDraw ? this.normalizeNumbers(record.nextDraw) : null
		})).filter(record => record.output !== null);
	}

	/**
	 * Валидация формата данных
	 * @param {Array} data - Данные для проверки
	 * @returns {boolean} Результат валидации
	 */
	static validateDataFormat(data) {
		if (!Array.isArray(data)) return false;

		return data.every(record => {
			return (
				Array.isArray(record.numbers) &&
				record.numbers.length === 6 &&
				record.numbers.every(num =>
					Number.isInteger(num) && num >= 1 && num <= 20
				)
			);
		});
	}

	/**
	 * Загрузка исторических данных
	 * @param {string} filename - Имя файла
	 * @returns {Promise<Array>} Загруженные данные
	 */
	static async loadHistoricalData(filename = 'historical.json') {
		try {
			const dataPath = path.join(__dirname, '../data', filename);
			if (!await fs.exists(dataPath)) {
				console.error('Файл с данными не найден:', dataPath);
				return [];
			}
			const data = await fs.readJSON(dataPath);
			return this.validateDataFormat(data) ? data : [];
		} catch (error) {
			console.error('Ошибка загрузки данных:', error);
			return [];
		}
	}

	/**
	 * Сохранение данных в файл
	 * @param {Array} data - Данные для сохранения
	 * @param {string} filename - Имя файла
	 * @returns {Promise<boolean>} Результат сохранения
	 */
	static async saveData(data, filename) {
		try {
			const filePath = path.join(__dirname, '../data', filename);
			await fs.writeJSON(filePath, data, { spaces: 2 });
			return true;
		} catch (error) {
			console.error('Ошибка сохранения данных:', error);
			return false;
		}
	}

	/**
	 * Расчет статистики предсказаний
	 * @param {Array} predictions - История предсказаний
	 * @returns {Object} Статистика
	 */
	static calculatePredictionStats(predictions) {
		if (!predictions || predictions.length === 0) {
			return {
				totalPredictions: 0,
				averageAccuracy: 0,
				successRate: 0
			};
		}

		const verifiedPredictions = predictions.filter(p => p.actualNumbers);
		const accuracies = verifiedPredictions.map(p => p.accuracy || 0);

		return {
			totalPredictions: predictions.length,
			verifiedPredictions: verifiedPredictions.length,
			averageAccuracy: accuracies.length > 0
				? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
				: 0,
			successRate: verifiedPredictions.length > 0
				? (verifiedPredictions.filter(p => p.accuracy >= 50).length / verifiedPredictions.length) * 100
				: 0
		};
	}

	/**
	 * Анализ паттернов в исторических данных
	 * @param {Array} historicalData - Исторические данные
	 * @returns {Object} Найденные паттерны
	 */
	static analyzePatterns(historicalData) {
		const patterns = {
			frequentPairs: new Map(),
			frequentSequences: new Map(),
			intervalStats: {
				min: Infinity,
				max: -Infinity,
				avg: 0
			}
		};

		historicalData.forEach((draw, index) => {
			// Анализ пар чисел
			for (let i = 0; i < draw.numbers.length; i++) {
				for (let j = i + 1; j < draw.numbers.length; j++) {
					const pair = `${draw.numbers[i]}-${draw.numbers[j]}`;
					patterns.frequentPairs.set(
						pair,
						(patterns.frequentPairs.get(pair) || 0) + 1
					);
				}
			}

			// Анализ интервалов между числами
			if (index > 0) {
				const interval = this.calculateInterval(
					historicalData[index - 1].numbers,
					draw.numbers
				);
				patterns.intervalStats.min = Math.min(patterns.intervalStats.min, interval);
				patterns.intervalStats.max = Math.max(patterns.intervalStats.max, interval);
				patterns.intervalStats.avg += interval;
			}
		});

		// Финализация статистики
		if (historicalData.length > 1) {
			patterns.intervalStats.avg /= (historicalData.length - 1);
		}

		return patterns;
	}

	/**
	 * Расчет интервала между двумя наборами чисел
	 * @private
	 */
	static calculateInterval(prev, current) {
		const sum1 = prev.reduce((a, b) => a + b, 0);
		const sum2 = current.reduce((a, b) => a + b, 0);
		return Math.abs(sum2 - sum1);
	}
}

module.exports = MLUtils; 