document.addEventListener('DOMContentLoaded', function () {
    // 获取所有输入框
    const inputs = document.querySelectorAll('input[type="number"]');

    // 为每个输入框加载保存的值或使用默认值
    inputs.forEach(input => {
        const savedValue = localStorage.getItem(input.id);
        if (savedValue !== null) {
            input.value = savedValue;
        }

        // 当输入值改变时保存到localStorage
        input.addEventListener('change', function () {
            localStorage.setItem(this.id, this.value);
        });
    });

    // Event listeners for tab buttons
    document.getElementById('conversionTab').addEventListener('click', function () {
        showTab('conversion');
    });
    document.getElementById('arpuTab').addEventListener('click', function () {
        showTab('arpu');
    });

    // Event listeners for calculate buttons
    document.getElementById('calculateConvBtn').addEventListener('click', calculateConversion);
    document.getElementById('calculateArpuBtn').addEventListener('click', calculateARPU);
});

function showTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tabs button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[id="${tabId}Tab"]`).classList.add('active');
}

function calculateConversion() {
    const sampleSizeA = parseInt(document.getElementById('sampleSizeA_conv').value);
    const conversionsA = parseInt(document.getElementById('conversionsA').value);
    const sampleSizeB = parseInt(document.getElementById('sampleSizeB_conv').value);
    const conversionsB = parseInt(document.getElementById('conversionsB').value);

    const p1 = conversionsA / sampleSizeA;
    const p2 = conversionsB / sampleSizeB;
    const pooledP = (conversionsA + conversionsB) / (sampleSizeA + sampleSizeB);
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / sampleSizeA + 1 / sampleSizeB));
    const z = (p1 - p2) / se;
    const pValue = 2 * (1 - normalCdf(Math.abs(z), 0, 1));
    const significant = pValue < 0.05;

    // 转化率提升百分比
    const improvement = (((p1 - p2) / p2) * 100).toFixed(2);

    // 置信度（假设这里使用标准正态分布的累积分布函数）
    const confidence = (1 - pValue) * 100;

    let improvementText;
    if (improvement > 0) {
        improvementText = `提高了 ${improvement}%`;
    } else if (improvement < 0) {
        improvementText = `降低了 ${Math.abs(improvement)}%`;
    } else {
        improvementText = `持平`;
    }

    let results;
    if (significant) {
        results = `
        <p>试验有显著的统计学差异。</p>
        <p>版本 A 的转化率比版本 B ${improvementText}</p>
        <p>我们 ${confidence.toFixed(2)}% 肯定版本 A 的改动会带来转换率${
            improvement > 0 ? '提升' : improvement < 0 ? '降低' : '持平'
        }。</p>
    `;
    } else {
        results = `
        <p>很遗憾，试验没有显著的统计学差异。</p>
        <p>版本 A 的转化率比版本 B ${improvementText}</p>
    `;
    }

    document.getElementById('results_conv').innerHTML = results;
}

function calculateARPU() {
    const sampleSizeA = parseInt(document.getElementById('sampleSizeA_arpu').value);
    const arpuA = parseFloat(document.getElementById('arpuA').value);
    const stdDevA = parseFloat(document.getElementById('stdDevA').value);
    const sampleSizeB = parseInt(document.getElementById('sampleSizeB_arpu').value);
    const arpuB = parseFloat(document.getElementById('arpuB').value);
    const stdDevB = parseFloat(document.getElementById('stdDevB').value);

    const seA = stdDevA / Math.sqrt(sampleSizeA);
    const seB = stdDevB / Math.sqrt(sampleSizeB);
    const se = Math.sqrt(seA * seA + seB * seB);
    const t = (arpuA - arpuB) / se;
    const df =
        (seA * seA + seB * seB) ** 2 / ((seA * seA) ** 2 / (sampleSizeA - 1) + (seB * seB) ** 2 / (sampleSizeB - 1));
    const pValue = 2 * (1 - tDistributionCdf(Math.abs(t), df));
    const significant = pValue < 0.05;

    // ARPU 提升百分比
    const improvement = (((arpuA - arpuB) / arpuB) * 100).toFixed(2);

    // 置信度（假设这里使用 Student's t 分布的累积分布函数）
    const confidence = (1 - pValue) * 100;

    let improvementText;
    if (improvement > 0) {
        improvementText = `提高了 ${improvement}%`;
    } else if (improvement < 0) {
        improvementText = `降低了 ${Math.abs(improvement)}%`;
    } else {
        improvementText = `持平`;
    }

    let results;
    if (significant) {
        results = `
        <p>试验有显著的统计学差异。</p>
        <p>版本 A 的 ARPU 比版本 B ${improvementText}</p>
        <p>我们 ${confidence.toFixed(2)}% 肯定版本 A 的改动会带来 ARPU ${
            improvement > 0 ? '提升' : improvement < 0 ? '降低' : '持平'
        }。</p>
    `;
    } else {
        results = `
        <p>很遗憾，试验没有显著的统计学差异。</p>
        <p>版本 A 的 ARPU 比版本 B ${improvementText}</p>
    `;
    }

    document.getElementById('results_arpu').innerHTML = results;
}

function erf(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}

function normalCdf(x, mean, std) {
    return (1 - erf((mean - x) / (Math.sqrt(2) * std))) / 2;
}

function tDistributionCdf(t, df) {
    const x = df / (df + t ** 2);
    let a = 0.5 * betaIncomplete(x, df / 2, 0.5);
    if (t > 0) a = 1 - a;
    return a;
}

function betaIncomplete(x, a, b) {
    const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) {
        return (bt * betacf(x, a, b)) / a;
    } else {
        return 1 - (bt * betacf(1 - x, b, a)) / b;
    }
}

function betacf(x, a, b) {
    const MAXIT = 100;
    const EPS = 3.0e-7;
    const FPMIN = 1.0e-30;
    let qab = a + b;
    let qap = a + 1;
    let qam = a - 1;
    let c = 1;
    let d = 1 - (qab * x) / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d;
    let h = d;
    for (let m = 1, m2 = 2; m <= MAXIT; m++, m2 += 2) {
        let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        h *= d * c;
        aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
        d = 1 + aa * d;
        if (Math.abs(d) < FPMIN) d = FPMIN;
        c = 1 + aa / c;
        if (Math.abs(c) < FPMIN) c = FPMIN;
        d = 1 / d;
        h *= d * c;
    }
    return h;
}

function logGamma(x) {
    const cof = [
        76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.001208650973866179,
        -5.395239384953e-6,
    ];
    let y = x;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) ser += cof[j] / ++y;
    return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
