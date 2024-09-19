import * as THREE from "three";

const width = 960;
const height = 540;

// 超立方体の頂点
const vertex = [
    [1, 1, 1, 1],
    [1, 1, 1, -1],
    [1, 1, -1, 1],
    [1, 1, -1, -1],
    [1, -1, 1, 1],
    [1, -1, 1, -1],
    [1, -1, -1, 1],
    [1, -1, -1, -1],
    [-1, 1, 1, 1],
    [-1, 1, 1, -1],
    [-1, 1, -1, 1],
    [-1, 1, -1, -1],
    [-1, -1, 1, 1],
    [-1, -1, 1, -1],
    [-1, -1, -1, 1],
    [-1, -1, -1, -1]
];

// 点と点のつながり
const link = [
    [0, 8],
    [1, 9],
    [2, 10],
    [3, 11],
    [4, 12],
    [5, 13],
    [6, 14],
    [7, 15],

    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
    [8, 12],
    [9, 13],
    [10, 14],
    [11, 15],

    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [8, 10],
    [9, 11],
    [12, 14],
    [13, 15],

    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [8, 9],
    [10, 11],
    [12, 13],
    [14, 15]
];

// レンダラーを作成
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#myCanvas')
});
renderer.setSize(width, height);
renderer.setPixelRatio(devicePixelRatio);

// カメラを作成
const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
// カメラの初期座標を設定（X座標:0, Y座標:0, Z座標:0）
camera.position.set(0, 0, 20);

// シーンを作成
const scene = new THREE.Scene();
const material = new THREE.LineBasicMaterial({ color: 0x008000 });

const lines = [];
for (let i = 0; i < link.length; i++) {
    const points = [];

    for (let j = 0; j < link[i].length; j++) {
        const vec = [
            vertex[link[i][j]][0],
            vertex[link[i][j]][1],
            vertex[link[i][j]][2],
            vertex[link[i][j]][3]
        ];

        const point = vec;
        const d = Math.hypot(point[0], point[1], point[2], point[3]);

        point[0] = (d / (d - point[3])) * point[0];
        point[1] = (d / (d - point[3])) * point[1];
        point[2] = (d / (d - point[3])) * point[2];

        points.push(new THREE.Vector3(point[0], point[1], point[2]));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    lines.push(line);
}

// 平行光源
const light = new THREE.DirectionalLight(0xffffff);
light.intensity = 1; // 光の強さを倍に
light.position.set(1, 1, 1); // ライトの方向
scene.add(light);

let xy = 0;
let yw = 0;

let dragging = false;
let xz = 0;
let yz = 0;

// 初回実行
tick();

function tick() {
    requestAnimationFrame(tick);

    // 4次元の頂点を回転し、3次元に投影
    for (let i = 0; i < lines.length; i++) {
        const positions = lines[i].geometry.attributes.position.array;

        let index = 0;
        for (let j = 0; j < 2; j++) {
            const vec = [
                vertex[link[i][j]][0],
                vertex[link[i][j]][1],
                vertex[link[i][j]][2],
                vertex[link[i][j]][3]
            ];

            const point = rotationYZ(rotationXZ(rotationXY(rotationYW(vec, yw), xy), xz), yz);
            const d = Math.hypot(point[0], point[1], point[2], point[3]);

            point[0] = (d / (d - point[3])) * point[0];
            point[1] = (d / (d - point[3])) * point[1];
            point[2] = (d / (d - point[3])) * point[2];

            positions[index++] = point[0];
            positions[index++] = point[1];
            positions[index++] = point[2];
        }

        lines[i].geometry.attributes.position.needsUpdate = true; 
    }

    if (!dragging) {
        xy += 0.01;
        yw += 0.01;
    }

    // レンダリング
    renderer.render(scene, camera);
}

function matmul(vec, mat) {
    const result = [0, 0, 0, 0];
    for (let i = 0; i < mat.length; i++) {
        for (let j = 0; j < mat[i].length; j++) {
            result[i] += vec[j] * mat[i][j];
        }
    }

    return result;
}

function rotationXY(point, rad) {
    const rot = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, Math.cos(rad), -Math.sin(rad)],
        [0, 0, Math.sin(rad), Math.cos(rad)]
    ];

    return matmul(point, rot);
}

function rotationXZ(point, rad) {
    const rot = [
        [1, 0, 0, 0],
        [0, Math.cos(rad), 0, -Math.sin(rad)],
        [0, 0, 1, 0],
        [0, Math.sin(rad), 0, Math.cos(rad)]
    ];

    return matmul(point, rot);
}

function rotationYZ(point, rad) {
    const rot = [
        [Math.cos(rad), 0, 0, -Math.sin(rad)],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [Math.sin(rad), 0, 0, Math.cos(rad)]
    ];

    return matmul(point, rot);
}

function rotationXW(point, rad) {
    const rot = [
        [1, 0, 0, 0],
        [0, Math.cos(rad), -Math.sin(rad), 0],
        [0, Math.sin(rad), Math.cos(rad), 0],
        [0, 0, 0, 1]
    ];

    return matmul(point, rot);
}

function rotationYW(point, rad) {
    const rot = [
        [Math.cos(rad), 0, -Math.sin(rad), 0],
        [0, 1, 0, 0],
        [Math.sin(rad), 0, Math.cos(rad), 0],
        [0, 0, 0, 1]
    ];

    return matmul(point, rot);
}

function rotationZW(point, rad) {
    const rot = [
        [Math.cos(rad), -Math.sin(rad), 0, 0],
        [Math.sin(rad), Math.cos(rad), 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
    ];

    return matmul(point, rot);
}

let x = 0;
let y = 0;

document.addEventListener("mousedown", (event) => {
    if (0 === event.button) {
        dragging = true;
        x = event.pageX;
        y = event.pageY;
    }
}, false);

document.addEventListener("mouseup", (event) => {
    if (0 === event.button)
        dragging = false;
}, false);

document.addEventListener("mousemove", (event) => {
    if (event.buttons & 1) {
        yz += (x - event.pageX) / 100;
        xz += (y - event.pageY) / 100;

        x = event.pageX;
        y = event.pageY;
    }
}, false);
