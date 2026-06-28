const CONDITION_COLORS = {
	NEW: { line: '#58a6ff', bg: 'rgba(88, 166, 255, 0.1)' },
	OPENBOX: { line: '#d29922', bg: 'rgba(210, 153, 34, 0.1)' },
	REFURB: { line: '#bc8cff', bg: 'rgba(188, 140, 255, 0.1)' },
	USED: { line: '#39d2c0', bg: 'rgba(57, 210, 192, 0.1)' },
};

const CONDITION_LABELS = {
	NEW: 'New',
	OPENBOX: 'Open Box',
	REFURB: 'Refurbished',
	USED: 'Used',
};

let chart = null;
const select = document.getElementById('product-select');
const loadingOverlay = document.getElementById('loadingOverlay');
const productInfo = document.getElementById('product-info');
const productName = document.getElementById('product-name');
const productLink = document.getElementById('product-link');
const chartSection = document.getElementById('chart-section');
const statsSection = document.getElementById('stats-section');
const statsBody = document.getElementById('stats-body');
const emptyState = document.getElementById('empty-state');

function fmtPrice(price) {
	return '$' + Math.round(price);
}

function fmtDate(d) {
	const date = new Date(d);
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Load Products ──
async function loadProducts() {
	try {
		const res = await fetch('/api/products');
		const products = await res.json();

		select.innerHTML = '<option value="">— Choose a product —</option>';
		products.forEach(p => {
			const option = document.createElement('option');
			option.value = p.id;
			option.dataset.url = p.url;
			option.dataset.name = p.name || '';
			option.dataset.store = p.store;
			option.textContent = (p.name || 'Unnamed') + ' (' + p.store + ')';
			select.appendChild(option);
		});
	} catch (e) {
		console.error('Failed to load products', e);
		select.innerHTML = '<option value="">Error loading products</option>';
	}
}

// ── Load & Render ──
async function loadProduct(productId) {
	if (!productId) {
		if (chart) chart.destroy();
		productInfo.style.display = 'none';
		chartSection.style.display = 'none';
		statsSection.style.display = 'none';
		emptyState.style.display = '';
		return;
	}

	emptyState.style.display = 'none';

	// Show product info
	const opt = select.selectedOptions[0];
	const name = opt.dataset.name || 'Unnamed Product';
	productName.textContent = name;
	productLink.href = opt.dataset.url;
	productInfo.style.display = '';

	loadingOverlay.classList.add('active');
	chartSection.style.display = '';

	try {
		const [pricesRes, statsRes] = await Promise.all([
			fetch('/api/products/' + productId + '/prices'),
			fetch('/api/products/' + productId + '/stats'),
		]);
		const prices = await pricesRes.json();
		const stats = await statsRes.json();

		renderChart(prices);
		renderStats(stats);
	} catch (e) {
		console.error('Failed to load product data', e);
	} finally {
		loadingOverlay.classList.remove('active');
	}
}

// ── Chart ──
function renderChart(prices) {
	const ctx = document.getElementById('priceChart').getContext('2d');
	if (chart) chart.destroy();

	// Group by condition & find min/max
	const grouped = {};
	let minPrice = Infinity;
	let maxPrice = -Infinity;

	prices.forEach(p => {
		const yVal = p.price !== null ? p.price : null;
		if (!grouped[p.condition]) grouped[p.condition] = [];
		grouped[p.condition].push({
			x: new Date(p.createdAt),
			y: yVal, // null will break the line on the chart
		});

		if (yVal !== null) {
			if (yVal < minPrice) minPrice = yVal;
			if (yVal > maxPrice) maxPrice = yVal;
		}
	});

	if (minPrice === Infinity) { minPrice = 0; maxPrice = 100; }

	// Calculate 10% padding for bounds, fallback to $10 padding if flat line
	const spread = maxPrice - minPrice;
	const padding = spread === 0 ? (maxPrice * 0.1 || 10) : spread * 0.1;
	
	const suggestedMin = Math.max(0, Math.floor(minPrice - padding));
	const suggestedMax = Math.ceil(maxPrice + padding);

	const datasets = Object.entries(grouped).map(([cond, points]) => {
		const colors = CONDITION_COLORS[cond] || { line: '#8b949e', bg: 'rgba(139,148,158,0.1)' };
		points.sort((a, b) => a.x - b.x);

		return {
			label: CONDITION_LABELS[cond] || cond,
			data: points,
			borderColor: colors.line,
			backgroundColor: colors.bg,
			borderWidth: 2,
			pointBackgroundColor: colors.line,
			pointBorderColor: 'transparent',
			pointRadius: 3,
			pointHoverRadius: 5,
			fill: true,
			stepped: 'after',
			tension: 0,
			spanGaps: false // Breaks the line if there's a null value
		};
	});

	chart = new Chart(ctx, {
		type: 'line',
		data: { datasets },
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: { intersect: false, mode: 'index' },
			plugins: {
				legend: {
					position: 'top',
					align: 'start',
					labels: {
						color: '#8b949e',
						font: { family: 'Inter', size: 12 },
						usePointStyle: true,
						pointStyle: 'circle',
						padding: 16,
					},
				},
				tooltip: {
					backgroundColor: '#1c2128',
					titleColor: '#e6edf3',
					bodyColor: '#8b949e',
					borderColor: '#30363d',
					borderWidth: 1,
					padding: 12,
					cornerRadius: 8,
					titleFont: { family: 'Inter', weight: '600' },
					bodyFont: { family: 'Inter' },
					callbacks: {
						label: (ctx) => ctx.dataset.label + ': $' + ctx.parsed.y.toFixed(2),
					},
				},
			},
			scales: {
				x: {
					type: 'time',
					time: { tooltipFormat: 'MMM d, yyyy h:mm a' },
					grid: { color: 'rgba(48, 54, 61, 0.5)', drawBorder: false },
					ticks: { color: '#6e7681', font: { family: 'Inter', size: 11 } },
				},
				y: {
					suggestedMin: suggestedMin,
					suggestedMax: suggestedMax,
					grid: { color: 'rgba(48, 54, 61, 0.5)', drawBorder: false },
					ticks: {
						color: '#6e7681',
						font: { family: 'Inter', size: 11 },
						precision: 0, // Forces integer ticks, avoiding cents
						callback: (v) => '$' + Math.round(v),
					},
				},
			},
		},
	});
}

// ── Stats Table ──
function renderStats(stats) {
	if (!stats.length) {
		statsSection.style.display = 'none';
		return;
	}

	statsBody.innerHTML = '';

	stats.forEach(s => {
		const colors = CONDITION_COLORS[s.condition] || { line: '#8b949e' };
		const label = CONDITION_LABELS[s.condition] || s.condition;

		const currentMarkup = s.current.price !== null
			? '<td class="price-val">' + fmtPrice(s.current.price) + '<span class="price-date">' + fmtDate(s.current.date) + '</span></td>'
			: '<td class="price-val" style="color: var(--text-muted)">Out of Stock<span class="price-date">' + fmtDate(s.current.date) + '</span></td>';

		const lowMarkup = s.lowest
			? '<td class="price-low"><span class="price-val">' + fmtPrice(s.lowest.price) + '</span><span class="price-date">' + fmtDate(s.lowest.date) + '</span></td>'
			: '<td class="price-val" style="color: var(--text-muted)">—</td>';

		const highMarkup = s.highest
			? '<td class="price-high"><span class="price-val">' + fmtPrice(s.highest.price) + '</span><span class="price-date">' + fmtDate(s.highest.date) + '</span></td>'
			: '<td class="price-val" style="color: var(--text-muted)">—</td>';

		const avgMarkup = s.average > 0
			? '<td class="price-val">' + fmtPrice(s.average) + '</td>'
			: '<td class="price-val" style="color: var(--text-muted)">—</td>';

		const tr = document.createElement('tr');
		tr.innerHTML =
			'<td><span class="cond-badge"><span class="cond-dot" style="background:' + colors.line + '"></span>' + label + '</span></td>' +
			currentMarkup +
			lowMarkup +
			highMarkup +
			avgMarkup;

		statsBody.appendChild(tr);
	});

	statsSection.style.display = '';
}

select.addEventListener('change', (e) => loadProduct(e.target.value));
loadProducts();
