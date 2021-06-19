import * as THREE from "../build/three.module.js";
import Stats from "../build/jsm/libs/stats.module.js";
import {TrackballControls} from "../build/jsm/controls/TrackballControls.js";
import {GUI} from "../build/jsm/libs/dat.gui.module.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import {
    initRenderer,
    initCamera,
    initDefaultBasicLight,
    InfoBox,
    createGroundPlaneWired,
    onWindowResize,
    lightFollowingCamera,
    degreesToRadians
} from "../libs/util/util.js";

var stats = new Stats(); // To show FPS information
var scene = new THREE.Scene(); // Create main scene
var renderer = initRenderer(); // View function in util/utils
var light = initDefaultBasicLight(scene);
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);

//================================== Modelagem do Avião ==================================
var aviao_obj = {
    esqueleto: {
        medidas: {},
        materiais: {},
        geomeria: {}
    },
    fuselagem: {
        _estacionaria: undefined,
        _movel: {},
        materiais: {}
    },
    ponto: new THREE.Vector3(0, 0, 0)
};

// Geometria do aviao
function cria_afuselagem(ponto) {
    if (ponto == undefined) {
        var aux = new THREE.Vector3(0, 0, 0);
    } else {
        var aux = new THREE.Vector3(ponto.x, ponto.y, ponto.z);
    }

    var fuselagem = aviao_obj;
    fuselagem.ponto = aux;
    var fuselagem_objeto = new THREE.Mesh();
    // Material do aviao
    var casco = new THREE.MeshPhongMaterial({color: 0xfafafa, side: THREE.DoubleSide});

    var metal_cinza = new THREE.MeshPhongMaterial({color: 0x595959, side: THREE.DoubleSide});

    var metal_ouro = new THREE.MeshPhongMaterial({color: 0xe1d663, side: THREE.DoubleSide});

    var tinta_azul = new THREE.MeshToonMaterial({color: 0x0031e7, side: THREE.DoubleSide});

    var casco_degradado = new THREE.MeshPhongMaterial({color: 0xc0c0c0, side: THREE.DoubleSide});

    fuselagem.fuselagem.materiais = {
        casco: casco,
        cinza_metalico: metal_cinza,
        amarelo_metalico: metal_ouro,
        azul_cartoon: tinta_azul,
        casco_degradado: casco_degradado
    };

    // Cabine
    var cabine_geometria = new THREE.CylinderGeometry(1.5, 1.5, 10, 50);
    var cabine = new THREE.Mesh(cabine_geometria, casco);
    fuselagem_objeto.add(cabine);
    // Setando os valores na variavel
    fuselagem.fuselagem._estacionaria = cabine;
    fuselagem.fuselagem._estacionaria.position.set(fuselagem.ponto.x, fuselagem.ponto.y, fuselagem.ponto.z);

    // Rabo
    var rabeta_geomeria = new THREE.CylinderGeometry(0.5, 1.5, 10, 50);
    var rabeta = new THREE.Mesh(rabeta_geomeria, casco);
    fuselagem_objeto.add(rabeta);
    rabeta.position.set(cabine.position.x, cabine.position.y + cabine.geometry.parameters.height, cabine.position.z);

    // Leme
    var leme_geometria = new THREE.BoxGeometry(2, 2, 0.35);
    var leme_dir = new THREE.Mesh();
    var leme_esq = new THREE.Mesh();
    var leme_cima = new THREE.Mesh();
    rabeta.add(leme_dir);
    rabeta.add(leme_esq);
    rabeta.add(leme_cima);
    leme_cima.rotateX(Math.PI / 2);
    leme_cima.rotateY(-Math.PI / 2);
    leme_cima.position.set(0, rabeta.geometry.parameters.height / 2 - leme_geometria.parameters.height / 2, 1);
    leme_dir.position.set(-1, rabeta.geometry.parameters.height / 2 - leme_geometria.parameters.height / 2, 0);
    leme_esq.position.set(1, rabeta.geometry.parameters.height / 2 - leme_geometria.parameters.height / 2, 0);

    // Asas
    var asa_prancha = new THREE.BoxGeometry(22, 5, 0.2);
    // Cima
    var asa_cima = new THREE.Mesh();
    cabine.add(asa_cima);
    asa_cima.position.set(0, 1, cabine_geometria.parameters.radiusTop + 1.5);

    // Baixo
    var asa_baixo = new THREE.Mesh();
    cabine.add(asa_baixo);
    asa_baixo.position.set(0, asa_cima.position.y, - cabine_geometria.parameters.radiusTop / 2);

    // Enfeites
    // Geometria dos aredondados
    var cilindro_geomeria_dir = new THREE.CylinderGeometry(asa_prancha.parameters.height / 2, asa_prancha.parameters.height / 2, 0.2, 30, 1, false, Math.PI, Math.PI);
    var cilindro_geomeria_esq = new THREE.CylinderGeometry(asa_prancha.parameters.height / 2, asa_prancha.parameters.height / 2, 0.2, 30, 1, false, 0, Math.PI);

    // Aredondados na asa cima
    var cilindro_dir_asa_cima = new THREE.Mesh(cilindro_geomeria_dir, casco);
    var cilindro_esq_asa_cima = new THREE.Mesh(cilindro_geomeria_esq, casco);
    // Direito
    asa_cima.add(cilindro_dir_asa_cima);
    cilindro_dir_asa_cima.rotateX(Math.PI / 2);
    cilindro_dir_asa_cima.position.set(- asa_prancha.parameters.width / 2, 0, 0);
    // Esquerdo
    asa_cima.add(cilindro_esq_asa_cima);
    cilindro_esq_asa_cima.rotateX(Math.PI / 2);
    cilindro_esq_asa_cima.position.set(asa_prancha.parameters.width / 2, 0, 0);

    // Aredondados na asa baixo
    var cilindro_dir_asa_baixo = new THREE.Mesh(cilindro_geomeria_dir, casco);
    var cilindro_esq_asa_baixo = new THREE.Mesh(cilindro_geomeria_esq, casco);
    // Direito
    asa_baixo.add(cilindro_dir_asa_baixo);
    cilindro_dir_asa_baixo.rotateX(Math.PI / 2);
    cilindro_dir_asa_baixo.position.set(- asa_prancha.parameters.width / 2, 0, 0);
    // Esquerdo
    asa_baixo.add(cilindro_esq_asa_baixo);
    cilindro_esq_asa_baixo.rotateX(Math.PI / 2);
    cilindro_esq_asa_baixo.position.set(asa_prancha.parameters.width / 2, 0, 0);
    // Apoios das asas
    // Vertical
    var cilindro_enfeite_geometria = new THREE.CylinderGeometry(asa_prancha.parameters.depth / 2, asa_prancha.parameters.depth / 2, asa_prancha.parameters.width, 30, 1, 0, 0, -Math.PI); // Atencion
    var cilindro_enfeite01 = new THREE.Mesh(cilindro_enfeite_geometria, metal_cinza);
    asa_cima.add(cilindro_enfeite01);
    cilindro_enfeite01.rotateZ(Math.PI / 2);
    cilindro_enfeite01.position.set(0, - asa_prancha.parameters.height / 2 + cilindro_enfeite_geometria.parameters.radiusBottom / 2, 0);

    var cilindro_enfeite02 = new THREE.Mesh(cilindro_enfeite_geometria, metal_cinza);
    asa_baixo.add(cilindro_enfeite02);
    cilindro_enfeite02.rotateZ(Math.PI / 2);
    cilindro_enfeite02.position.set(0, - asa_prancha.parameters.height / 2 + cilindro_enfeite_geometria.parameters.radiusBottom / 2, 0);

    var cilindro_apoio_geometria = new THREE.CylinderGeometry(0.15, 0.15, Math.abs(asa_cima.position.z - asa_baixo.position.z), 30);
    // Direito
    var cilindro_apoio01 = new THREE.Mesh(cilindro_apoio_geometria, metal_cinza);
    asa_cima.add(cilindro_apoio01);
    cilindro_apoio01.rotateX(Math.PI / 2);
    cilindro_apoio01.position.set(- cabine_geometria.parameters.radiusBottom - 1, 1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    var cilindro_apoio02 = new THREE.Mesh(cilindro_apoio_geometria, metal_cinza);
    asa_cima.add(cilindro_apoio02);
    cilindro_apoio02.rotateX(Math.PI / 2);
    cilindro_apoio02.position.set(- cabine_geometria.parameters.radiusBottom - 1, -1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    var cilindro_apoio03 = new THREE.Mesh(cilindro_apoio_geometria, metal_cinza);
    asa_cima.add(cilindro_apoio03);
    cilindro_apoio03.rotateX(Math.PI / 2);
    cilindro_apoio03.position.set(- cabine_geometria.parameters.radiusBottom - asa_prancha.parameters.width / 2 + 2, 1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    var cilindro_apoio04 = new THREE.Mesh(cilindro_apoio_geometria, metal_cinza);
    asa_cima.add(cilindro_apoio04);
    cilindro_apoio04.rotateX(Math.PI / 2);
    cilindro_apoio04.position.set(- cabine_geometria.parameters.radiusBottom - asa_prancha.parameters.width / 2 + 2, -1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    // Esquerda
    var cilindro_apoio05 = new THREE.Mesh(cilindro_apoio_geometria, metal_cinza);
    asa_cima.add(cilindro_apoio05);
    cilindro_apoio05.rotateX(Math.PI / 2);
    cilindro_apoio05.position.set(cabine_geometria.parameters.radiusBottom + 1, 1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    var cilindro_apoio06 = new THREE.Mesh(cilindro_apoio_geometria, metal_cinza);
    asa_cima.add(cilindro_apoio06);
    cilindro_apoio06.rotateX(Math.PI / 2);
    cilindro_apoio06.position.set(cabine_geometria.parameters.radiusBottom + 1, -1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    var cilindro_apoio07 = new THREE.Mesh(cilindro_apoio_geometria, metal_cinza);
    asa_cima.add(cilindro_apoio07);
    cilindro_apoio07.rotateX(Math.PI / 2);
    cilindro_apoio07.position.set(cabine_geometria.parameters.radiusBottom + asa_prancha.parameters.width / 2 - 2, 1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    var cilindro_apoio08 = new THREE.Mesh(cilindro_apoio_geometria, metal_cinza);
    asa_cima.add(cilindro_apoio08);
    cilindro_apoio08.rotateX(Math.PI / 2);
    cilindro_apoio08.position.set(cabine_geometria.parameters.radiusBottom + asa_prancha.parameters.width / 2 - 2, -1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    // 45º
    var cilindro_apoio_45_geometria = new THREE.CylinderGeometry(0.05, 0.05, Math.sqrt(Math.pow(Math.abs(cilindro_apoio01.position.x - cilindro_apoio03.position.x), 2) + Math.pow(cilindro_apoio_geometria.parameters.height, 2)), 30);
    // Direito
    // Atras
    var cilindro_apoio45_01 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_01);
    cilindro_apoio45_01.rotateX(Math.PI / 2);
    cilindro_apoio45_01.rotateZ(Math.PI / 2.7);
    cilindro_apoio45_01.position.set(-1 - cabine_geometria.parameters.radiusBottom - Math.abs(cilindro_apoio01.position.x - cilindro_apoio03.position.x) / 2, cilindro_apoio01.position.y, cilindro_apoio01.position.z);

    var cilindro_apoio45_02 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_02);
    cilindro_apoio45_02.rotateX(Math.PI / 2);
    cilindro_apoio45_02.rotateZ(-Math.PI / 2.7);
    cilindro_apoio45_02.position.set(-1 - cabine_geometria.parameters.radiusBottom - Math.abs(cilindro_apoio01.position.x - cilindro_apoio03.position.x) / 2, cilindro_apoio01.position.y, cilindro_apoio01.position.z);

    // Frente
    var cilindro_apoio45_03 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_03);
    cilindro_apoio45_03.rotateX(Math.PI / 2);
    cilindro_apoio45_03.rotateZ(Math.PI / 2.7);
    cilindro_apoio45_03.position.set(-1 - cabine_geometria.parameters.radiusBottom - Math.abs(cilindro_apoio02.position.x - cilindro_apoio04.position.x) / 2, cilindro_apoio02.position.y, cilindro_apoio02.position.z);

    var cilindro_apoio45_04 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_04);
    cilindro_apoio45_04.rotateX(Math.PI / 2);
    cilindro_apoio45_04.rotateZ(-Math.PI / 2.7);
    cilindro_apoio45_04.position.set(-1 - cabine_geometria.parameters.radiusBottom - Math.abs(cilindro_apoio02.position.x - cilindro_apoio04.position.x) / 2, cilindro_apoio02.position.y, cilindro_apoio02.position.z);

    // Esquerda
    // Atras
    var cilindro_apoio45_05 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_05);
    cilindro_apoio45_05.rotateX(Math.PI / 2);
    cilindro_apoio45_05.rotateZ(Math.PI / 2.7);
    cilindro_apoio45_05.position.set(1 + cabine_geometria.parameters.radiusBottom + Math.abs(cilindro_apoio05.position.x - cilindro_apoio07.position.x) / 2, cilindro_apoio05.position.y, cilindro_apoio05.position.z);

    var cilindro_apoio45_02 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_02);
    cilindro_apoio45_02.rotateX(Math.PI / 2);
    cilindro_apoio45_02.rotateZ(-Math.PI / 2.7);
    cilindro_apoio45_02.position.set(1 + cabine_geometria.parameters.radiusBottom + Math.abs(cilindro_apoio05.position.x - cilindro_apoio07.position.x) / 2, cilindro_apoio05.position.y, cilindro_apoio05.position.z);

    // Frente
    var cilindro_apoio45_03 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_03);
    cilindro_apoio45_03.rotateX(Math.PI / 2);
    cilindro_apoio45_03.rotateZ(Math.PI / 2.7);
    cilindro_apoio45_03.position.set(1 + cabine_geometria.parameters.radiusBottom + Math.abs(cilindro_apoio06.position.x - cilindro_apoio08.position.x) / 2, cilindro_apoio06.position.y, cilindro_apoio06.position.z);

    var cilindro_apoio45_04 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_04);
    cilindro_apoio45_04.rotateX(Math.PI / 2);
    cilindro_apoio45_04.rotateZ(-Math.PI / 2.7);
    cilindro_apoio45_04.position.set(1 + cabine_geometria.parameters.radiusBottom + Math.abs(cilindro_apoio06.position.x - cilindro_apoio08.position.x) / 2, cilindro_apoio06.position.y, cilindro_apoio06.position.z);
    // Marcas
    // Circulos
    var esfera_dentro_geometria = new THREE.RingGeometry(0.5, 0, 30);
    var esfera_fora_geometria = new THREE.RingGeometry(1, 1.5, 30);
    // Direito
    var esfera_dentro_direita = new THREE.Mesh(esfera_dentro_geometria, tinta_azul);
    asa_cima.add(esfera_dentro_direita);
    esfera_dentro_direita.position.set(- asa_prancha.parameters.width / 2, 0, asa_prancha.parameters.depth / 2 + 0.001);

    var esfera_fora_direita = new THREE.Mesh(esfera_fora_geometria, tinta_azul);
    asa_cima.add(esfera_fora_direita);
    esfera_fora_direita.position.set(- asa_prancha.parameters.width / 2, 0, asa_prancha.parameters.depth / 2 + 0.001);
    // Esquerda
    var esfera_dentro_esquerda = new THREE.Mesh(esfera_dentro_geometria, tinta_azul);
    asa_cima.add(esfera_dentro_esquerda);
    esfera_dentro_esquerda.position.set(asa_prancha.parameters.width / 2, 0, asa_prancha.parameters.depth / 2 + 0.001);

    var esfera_fora_esquerda = new THREE.Mesh(esfera_fora_geometria, tinta_azul);
    asa_cima.add(esfera_fora_esquerda);
    esfera_fora_esquerda.position.set(asa_prancha.parameters.width / 2, 0, asa_prancha.parameters.depth / 2 + 0.001);
    // Motor
    var protecao_geometria = new THREE.TorusGeometry(cabine_geometria.parameters.radiusBottom, cabine_geometria.parameters.radiusBottom / 2, 30, 6);
    var protecao = new THREE.Mesh(protecao_geometria, metal_cinza);
    cabine.add(protecao);
    protecao.rotateX(Math.PI / 2);
    protecao.position.set(0, - cabine_geometria.parameters.height / 2, 0);

    var cone_motor_geometria = new THREE.ConeGeometry(cabine_geometria.parameters.radiusBottom, 3);
    var cone_motor = new THREE.Mesh(cone_motor_geometria, tinta_azul);
    cabine.add(cone_motor);

    cone_motor.rotateX(Math.PI);
    cone_motor.position.set(0, - cabine_geometria.parameters.height / 2 - cone_motor_geometria.parameters.height / 2, 0);

    var pa_geometria = new THREE.BoxGeometry(0.65, 0.2, 3);
    var pa01 = new THREE.Mesh(pa_geometria, metal_cinza);
    cone_motor.add(pa01);
    pa01.position.set(0, 0, pa_geometria.parameters.depth / 2);

    var pa02 = new THREE.Mesh(pa_geometria, metal_cinza);
    cone_motor.add(pa02);
    pa02.rotateY(Math.PI / 2);
    pa02.position.set(pa_geometria.parameters.depth / 2, 0, 0);

    var pa03 = new THREE.Mesh(pa_geometria, metal_cinza);
    cone_motor.add(pa03);
    pa03.position.set(0, 0, - pa_geometria.parameters.depth / 2);

    var pa04 = new THREE.Mesh(pa_geometria, metal_cinza);
    cone_motor.add(pa04);
    pa04.rotateY(Math.PI / 2);
    pa04.position.set(- pa_geometria.parameters.depth / 2, 0, 0);

    // # fuselagem.fuselagem._movel = { motor : cone_motor }

    // Flaps
    // Asa
    var flap_asa_geometria = new THREE.BoxGeometry(asa_prancha.parameters.width / 3, asa_prancha.parameters.height / 4, asa_prancha.parameters.depth);
    var flap_asa_direita_cima = new THREE.Mesh(flap_asa_geometria, casco_degradado);
    asa_cima.add(flap_asa_direita_cima);
    flap_asa_direita_cima.position.set(- asa_prancha.parameters.width / 3, asa_prancha.parameters.height / 2 - flap_asa_geometria.parameters.height / 2, 0);

    var flap_asa_esquerda_cima = new THREE.Mesh(flap_asa_geometria, casco_degradado);
    asa_cima.add(flap_asa_esquerda_cima);
    flap_asa_esquerda_cima.position.set(asa_prancha.parameters.width / 2 - flap_asa_geometria.parameters.width / 2, asa_prancha.parameters.height / 2 - flap_asa_geometria.parameters.height / 2, 0);

    var flap_asa_direita_baixo = new THREE.Mesh(flap_asa_geometria, casco_degradado);
    asa_baixo.add(flap_asa_direita_baixo);
    flap_asa_direita_baixo.position.set(- asa_prancha.parameters.width / 3, asa_prancha.parameters.height / 2 - flap_asa_geometria.parameters.height / 2, 0);

    var flap_asa_esquerda_baixo = new THREE.Mesh(flap_asa_geometria, casco_degradado);
    asa_baixo.add(flap_asa_esquerda_baixo);
    flap_asa_esquerda_baixo.position.set(asa_prancha.parameters.width / 2 - flap_asa_geometria.parameters.width / 2, asa_prancha.parameters.height / 2 - flap_asa_geometria.parameters.height / 2, 0);

    // # fuselagem.fuselagem._movel = { conjunto_flap_direito : {cima: flap_asa_direita_cima , baixo: flap_asa_direita_baixo}, conjunto_flap_esquerdo :  {cima: flap_asa_esquerda_cima , baixo: flap_asa_esquerda_baixo}}

    // Asa dividida
    var asa_meio_geometria = new THREE.BoxGeometry(asa_prancha.parameters.width - 2 * flap_asa_geometria.parameters.width, asa_prancha.parameters.height, asa_prancha.parameters.depth);
    var asa_frente_geometria = new THREE.BoxGeometry(asa_prancha.parameters.width, asa_prancha.parameters.height - flap_asa_geometria.parameters.height, asa_prancha.parameters.depth);

    var asa_meio_cima = new THREE.Mesh(asa_meio_geometria, casco);
    asa_cima.add(asa_meio_cima);

    var asa_frente_cima = new THREE.Mesh(asa_frente_geometria, casco);
    asa_cima.add(asa_frente_cima);
    asa_frente_cima.position.set(0, - flap_asa_geometria.parameters.height / 2, 0);

    var asa_meio_baixo = new THREE.Mesh(asa_meio_geometria, casco);
    asa_baixo.add(asa_meio_baixo);

    var asa_frente_baixo = new THREE.Mesh(asa_frente_geometria, casco);
    asa_baixo.add(asa_frente_baixo);
    asa_frente_baixo.position.set(0, - flap_asa_geometria.parameters.height / 2, 0);
    // Leme
    var flap_leme_geomatria = new THREE.BoxGeometry(leme_geometria.parameters.height * 0.5, leme_geometria.parameters.width / 3, leme_geometria.parameters.depth);

    var flap_leme_dir = new THREE.Mesh(flap_leme_geomatria, casco_degradado);
    leme_dir.add(flap_leme_dir);
    flap_leme_dir.position.set(- flap_leme_geomatria.parameters.width / 2, flap_leme_geomatria.parameters.height, 0);

    var flap_leme_esq = new THREE.Mesh(flap_leme_geomatria, casco_degradado);
    leme_esq.add(flap_leme_esq);
    flap_leme_esq.position.set(flap_leme_geomatria.parameters.width / 2, flap_leme_geomatria.parameters.height, 0);

    var flap_leme_cima = new THREE.Mesh(flap_leme_geomatria, casco_degradado);
    leme_cima.add(flap_leme_cima);
    flap_leme_cima.position.set(- flap_leme_geomatria.parameters.height, flap_leme_geomatria.parameters.width / 2, 0);
    flap_leme_cima.rotateZ(Math.PI / 2);

    // Leme dividido
    var leme_meio_geometria = new THREE.BoxGeometry(leme_geometria.parameters.height * 0.3, leme_geometria.parameters.width / 3, leme_geometria.parameters.depth);
    var leme_frente_geometria = new THREE.BoxGeometry(leme_geometria.parameters.height, (2 * leme_geometria.parameters.width) / 3, leme_geometria.parameters.depth);

    // Direito
    var leme_dir_meio = new THREE.Mesh(leme_meio_geometria, casco);
    leme_dir.add(leme_dir_meio);
    leme_dir_meio.position.set(leme_meio_geometria.parameters.width / 2, leme_meio_geometria.parameters.height, 0);

    var leme_dir_frente = new THREE.Mesh(leme_frente_geometria, casco);
    leme_dir.add(leme_dir_frente);
    leme_dir_frente.position.set(0, - leme_meio_geometria.parameters.height / 2, 0);
    // # fuselagem.fuselagem._movel = { conjunto_flap_direito : flap_leme_dir}

    // Esquerdo
    var leme_esq_meio = new THREE.Mesh(leme_meio_geometria, casco);
    leme_esq.add(leme_esq_meio);
    leme_esq_meio.position.set(- leme_meio_geometria.parameters.width / 2, leme_meio_geometria.parameters.height, 0);

    var leme_esq_frente = new THREE.Mesh(leme_frente_geometria, casco);
    leme_esq.add(leme_esq_frente);
    leme_esq_frente.position.set(0, - leme_meio_geometria.parameters.height / 2, 0);
    // # fuselagem.fuselagem._movel = { conjunto_flap_esquerdo : flap_leme_esq}

    // Meio
    var leme_cima_meio = new THREE.Mesh(leme_meio_geometria, casco);
    leme_cima.add(leme_cima_meio);
    leme_cima_meio.position.set(- leme_meio_geometria.parameters.height, - flap_leme_geomatria.parameters.width * 0.3, 0);
    leme_cima_meio.rotateZ(Math.PI / 2);

    var leme_cima_frente = new THREE.Mesh(leme_frente_geometria, casco);
    leme_cima.add(leme_cima_frente);
    leme_cima_frente.position.set(leme_meio_geometria.parameters.height / 2, 0, 0);
    leme_cima_frente.rotateZ(Math.PI / 2);
    // # fuselagem.fuselagem._movel = { leme_meio : flap_leme_cima}

    // Adiçao dos grupos moveis
    // #errado ao contrario
    fuselagem.fuselagem._movel = {
        motor: cone_motor,
        conjunto_flap_direito: {
            cima: flap_asa_direita_cima,
            baixo: flap_asa_direita_baixo,
            atras: flap_leme_dir
        },
        conjunto_flap_esquerdo: {
            cima: flap_asa_esquerda_cima,
            baixo: flap_asa_esquerda_baixo,
            atras: flap_leme_esq
        },
        leme_meio: flap_leme_cima
    };

    // Boias
    // var suporte_boia_superior_geometria = new THREE.CylinderGeometry(1,1,3,30)
    // var suporte_boia_inferior_geometria = new THREE.CylinderGeometry(1,1,5,30)

    fuselagem.fuselagem._estacionaria = fuselagem_objeto;
    aviao_obj = fuselagem;

    return fuselagem;
}

//================================== Posicionamento do avião ==================================
// Adiciona o avião na cena definindo sua posição inicial
scene.add(cria_afuselagem({x: 0, y: 0, z: 4}).fuselagem._estacionaria);

// Rotaciona o avião em relacão a X,Y,Z
aviao_obj.fuselagem._estacionaria.rotateZ(Math.PI);

//================================== Auxiliares de cena ==================================
// Show axes (parameter is size of each axis)
var axesHelper = new THREE.AxesHelper(12);
scene.add(axesHelper);

// Listen window size changes
window.addEventListener("resize", function () {
    onWindowResize(camera, renderer);
}, false);

// Criando o plano e adicionando na cena
var plano = createGroundPlaneWired(5000, 5000, 20, 20); // width, height
plano.rotation.set(0, 0, 0);
scene.add(plano);

// Cria uma variável para cuidar da mudança de tipo de câmera
var keyboard = new KeyboardState();


//================================== Configurações de camera ==================================
// Parametros do avião
var posicaoSalva = [0,0,0];
var rotacaoSalva = [0,0,0]

// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement);

// Camera padrão
camera.position.set(
    aviao_obj.fuselagem._estacionaria.position.x, 
    aviao_obj.fuselagem._estacionaria.position.y-80.0, 
    aviao_obj.fuselagem._estacionaria.position.z+20.0);

camera.lookAt(aviao_obj.fuselagem._estacionaria.position.x,
    aviao_obj.fuselagem._estacionaria.position.y,
    aviao_obj.fuselagem._estacionaria.position.z);
//camera.up.set(0, 1, 0);

var tipoCamera = true;  // true => Modo de Inspeção || false => Simulação

// CameraHolder
var cameraHolder = new THREE.Object3D();
//cameraHolder.position.set(camera.position.x,camera.position.y,camera.position.z);
//cameraHolder.lookAt(aviao_obj.fuselagem._estacionaria.position.x,
     //aviao_obj.fuselagem._estacionaria.position.y,
     //aviao_obj.fuselagem._estacionaria.position.z);

//cameraHolder.up.set(0, 1, 0);



cameraHolder.add(camera);
scene.add(cameraHolder);
mudaCamera(tipoCamera);

var camteste = camera;

function buildInterface() { // Mostrando as informações na tela
    var controls = new InfoBox();
    controls.add("Simulador de voo - Controles");
    controls.addParagraph(); // Setas:https://textkool.com/pt/symbols/arrows-symbols
    controls.add("# Q  /  A - Inspeção/Simulador");
    controls.add("# ↥  /  ↧ - Sobe/Desce o bico do avião");
    controls.add("# ↤ /  ↦ - Vira para Esquerda/Direita");
    controls.add("# <  /  >  - Rotaciona o avião");
    controls.add("#  SPACE  - Camera em Inspeção/Simulador");
    controls.show();
}

// Muda e controla o comportamento das cameras
function mudaCamera() {
    console.log(camera.position)
    if (tipoCamera) {
        camteste = camera;
        // Inspeção
        // Ativa o trackball
        trackballControls.enabled = true;
        //cameraHolder.enabled = false;
        //scene.remove(cameraHolder)
        // Remove o plano
        scene.remove(plano);

        

        // Salva a posição do avião
        posicaoSalva[0] = aviao_obj.fuselagem._estacionaria.position.x;
        posicaoSalva[1] = aviao_obj.fuselagem._estacionaria.position.y;
        posicaoSalva[2] = aviao_obj.fuselagem._estacionaria.position.z;
        
        //Salva a rotação do avião
        rotacaoSalva[0] = aviao_obj.fuselagem._estacionaria.rotation.x;
        rotacaoSalva[1] = aviao_obj.fuselagem._estacionaria.rotation.y;
        rotacaoSalva[2] = aviao_obj.fuselagem._estacionaria.rotation.z;

        // O avião deve estar posicionado na origem, por conta do trackball
        aviao_obj.fuselagem._estacionaria.position.x = 0;
        aviao_obj.fuselagem._estacionaria.position.y = 0;
        aviao_obj.fuselagem._estacionaria.position.z = 0;
        aviao_obj.fuselagem._estacionaria.rotation.x = 0;
        aviao_obj.fuselagem._estacionaria.rotation.y = 0;
        aviao_obj.fuselagem._estacionaria.rotation.z = Math.PI;

        cameraHolder.position.set(0.0, 0.0, 0.0);
        cameraHolder.lookAt(0.0, 0.0, 0.0);
        
        // Reseta a posição da camera para o centro do avião
        // cameraHolder.lookAt(0, 0, 0);
        // cameraHolder.position.set(0, 0, 0);
        // cameraHolder.up.set(0, 1, 0);

    } else {    // Simulação
        
        // Desativa o trackball
        trackballControls.enabled = false;
        // Adiciona o plano
        scene.add(plano);
        //scene.add(cameraHolder);
        if(camteste){
            camera = camteste;
        }

        // Sugestão: Mudar o tipo de camera de simulação com os botões numéricos

        // Adiciona a camera ao avião ou  a algum objeto junto ao avião
        // CameraHolder a ser posicionada atrás do avião
        // cameraHolder.position.set(0, 0, 0);
        //cameraHolder.applyQuaternion(0.5,0.5,0.5)
        //camera.rotation.x = 0;
        cameraHolder.rotation.x = aviao_obj.fuselagem._estacionaria.rotation.x;
        //cameraHolder.rotation.y = aviao_obj.fuselagem._estacionaria.rotation.y;
        //cameraHolder.rotation.z = (aviao_obj.fuselagem._estacionaria.rotation.z);

        /*
        cameraHolder.position.set(aviao_obj.fuselagem._estacionaria.position.x,
            aviao_obj.fuselagem._estacionaria.position.y,
            aviao_obj.fuselagem._estacionaria.position.z);
            */
        cameraHolder.position.x = aviao_obj.fuselagem._estacionaria.position.x;
        cameraHolder.position.y = aviao_obj.fuselagem._estacionaria.position.y;
        cameraHolder.position.z = aviao_obj.fuselagem._estacionaria.position.z;

        
        //console.log(cameraHolder.position)
        // cameraHolder.position.y += velocidade;
        // cameraHolder.translateY(velocidade)
        // cameraHolder.translateZ(velocidade)
        /*
        cameraHolder.lookAt(
          aviao_obj.fuselagem._estacionaria.position.z, 
          aviao_obj.fuselagem._estacionaria.position.z, 
          aviao_obj.fuselagem._estacionaria.position.z);
*/
        // cameraHolder.position.z = -20;
        // cameraHolder.translateY(1)
        // cameraHolder.position.set(aviao_obj.fuselagem._estacionaria.position.x,aviao_obj.fuselagem._estacionaria.position.y,0);
        // cameraHolder.lookAt(0,0,0);
        //cameraHolder.up.set(0, 1, 0);
    }
}



//============================= Configurações de Movimentação =============================
// Controle de botões pressionados

var pressionadoUP = false;
var pressionadoDown = false;
var pressionadoLeft = false;
var pressionadoRight = false;
var pressionadoMenor = false;
var pressionadoMaior = false;

// Vetor da rotação do avião
var vetRot = [0,0,0]
var anguloRot = degreesToRadians(0.2);

var vetVel = [0,0,0]
var velocidade = 0;

// Função controladora da camera a partir do teclado
function keyboardUpdate() {
    keyboard.update();

    var eixoX = new THREE.Vector3(1, 0, 0); // Set Y axis
    var eixoY = new THREE.Vector3(0, 1, 1); // Set Y axis
    var eixoZ = new THREE.Vector3(0, 0, 1); // Set Z axis
    // Muda o tipo de câmera
    if (keyboard.down("space")) {
        tipoCamera = ! tipoCamera;
        mudaCamera();
    }

    if (! tipoCamera) { // Movimentação
        if (keyboard.pressed("Q")) {
            // Aceleração progressiva
            // Lembrar de rodar as helices
            if (velocidade <= 1.0) { 
                velocidade += 0.003;
            }
        }

        if (keyboard.pressed("A")) { // Desaceleração progressiva
            if (velocidade > 0) {
                velocidade -= 0.003;
            } else {
                velocidade = 0;
            }
        }

        if (keyboard.pressed("up")) { // Desce o bico do avião
            pressionadoUP = true;

            //console.log(vetRot)
            //velocidadez +=0.005;
            //aviao_obj.fuselagem._estacionaria.position.z -= -velocidadez;
            //aviao_obj.fuselagem._estacionaria.rotation.x -= anguloRot;

            /* Lembrar de rotacionar os flaps das asas
            aviao_obj.fuselagem._movel.conjunto_flap_direito.cima.rotateX(Math.PI / 20);
            aviao_obj.fuselagem._movel.conjunto_flap_direito.baixo.rotateX(Math.PI / 20);
            aviao_obj.fuselagem._movel.conjunto_flap_direito.atras.rotateX(Math.PI / 20);
            */

            // Salva o valor da velocidade
            vetVel[0] -= 0.002;
            //aviao_obj.fuselagem._estacionaria.translateZ(vetVel[0]);
            if(Math.abs(aviao_obj.fuselagem._estacionaria.rotation.x)<0.45){
            //aviao_obj.fuselagem._estacionaria.rotation.x -= anguloRot;
            aviao_obj.fuselagem._estacionaria.rotateOnAxis(eixoX, Math.abs(anguloRot)) 
            cameraHolder.rotation.x -= anguloRot;
            // Salva o valor da rotação
            vetRot[0] = vetRot[0] - anguloRot;
            }
        }

        if (keyboard.pressed("down")) { // Sobe o bico do avião
            pressionadoDown = true;
            /*
            velocidadez -=0.005; //velocidade diminui
            aviao_obj.fuselagem._estacionaria.position.z += -velocidadez; //Altura aumenta
            aviao_obj.fuselagem._estacionaria.rotation.x += anguloRot;*/

            if(Math.abs(aviao_obj.fuselagem._estacionaria.rotation.x)<0.90){
            vetVel[0] += 0.002;
            //aviao_obj.fuselagem._estacionaria.translateZ(vetVel[0]);

            //aviao_obj.fuselagem._estacionaria.rotation.x += anguloRot;
            //aviao_obj.fuselagem._estacionaria
            aviao_obj.fuselagem._estacionaria.rotateOnAxis(eixoX, -Math.abs(anguloRot))
            // Salva o valor da rotação
            vetRot[0] = vetRot[0] + anguloRot;
            console.log(Math.abs(aviao_obj.fuselagem._estacionaria.rotation.x))
            }
        }

        
        if (keyboard.pressed("left")) { // Gira para esquerda
            pressionadoLeft = true;
            
            if(vetVel[1]<=0.01){
            vetVel[1] += 0.002;
            }
            //aviao_obj.fuselagem._estacionaria.rotation.y -= anguloRot*2;
            //aviao_obj.fuselagem._estacionaria.translateX(vetVel[1]);
            //aviao_obj.fuselagem._estacionaria.rotateOnAxis(eixoZ, vetVel[1])
            //aviao_obj.fuselagem._estacionaria.rotation.z += anguloRot*2;
            aviao_obj.fuselagem._estacionaria.rotateOnAxis(eixoZ, +Math.abs(anguloRot*2))
            //aviao_obj.fuselagem._estacionaria.rotateOnAxis(eixoY, Math.abs(anguloRot))
            cameraHolder.rotation.z += anguloRot*2;
            //aviao_obj.fuselagem._estacionaria.rotation.y -= anguloRot*2;
            
            
            
            /*
            aviao_obj.fuselagem._estacionaria.position.x -= velocidade;
            aviao_obj.fuselagem._estacionaria.position.y += velocidade;
            aviao_obj.fuselagem._estacionaria.rotation.y -= anguloRot*2;*/
            //aviao_obj.fuselagem._estacionaria.rotateOnAxis(rotY, + degreesToRadians(0.3));
            
            // Salva o valor da rotação
            vetRot[1] = vetRot[1] + anguloRot;
        }
        if (keyboard.pressed("right")) { // Gira para direita
            pressionadoRight = true;

            if(vetVel[1]>=-0.01){
                vetVel[1] -= 0.002;
                }
            //vetVel[1] -= 0.002;
            //aviao_obj.fuselagem._estacionaria.translateX(vetVel[1]);
            //aviao_obj.fuselagem._estacionaria.rotation.y += anguloRot*2;
            //aviao_obj.fuselagem._estacionaria.rotation.z -= anguloRot*2;
            aviao_obj.fuselagem._estacionaria.rotateOnAxis(eixoZ, -Math.abs(anguloRot*2))
            cameraHolder.rotation.z -= anguloRot*2;
            /*
            aviao_obj.fuselagem._estacionaria.position.x += velocidade;
            aviao_obj.fuselagem._estacionaria.position.y += velocidade;
            aviao_obj.fuselagem._estacionaria.rotation.y += anguloRot*2;
            */
            // Salva o valor da rotação
            vetRot[1] = vetRot[1] - anguloRot;
        }
        if (keyboard.pressed(",")) { // Gira o leme para esquerda
            pressionadoMenor = true;
            vetVel[1] -= 0.02;
            //aviao_obj.fuselagem._estacionaria.translateY(vetVel[1]);
            aviao_obj.fuselagem._estacionaria.rotateOnAxis(eixoY, Math.abs(anguloRot))
            //aviao_obj.fuselagem._estacionaria.rotation.y -= anguloRot*2;
            //aviao_obj.fuselagem._estacionaria.rotation.z += anguloRot;
            
        }
        if (keyboard.pressed(".")) { // Gira o leme?,
            pressionadoMaior = true;
            vetVel[1] += 0.02;
            aviao_obj.fuselagem._estacionaria.translateY(vetVel[1]);
            aviao_obj.fuselagem._estacionaria.rotation.z -= anguloRot;

        }



        // Guarda a mudança de estado das teclas
        if (keyboard.up("up")) {
            pressionadoUP = false;
        }
        if (keyboard.up("down")) {
            pressionadoDown = false;
        }
        if (keyboard.up("left")) {
            pressionadoLeft = false;
        }
        if (keyboard.up("right")) {
            pressionadoRight = false;
        }
        if (keyboard.up(",")) {
            pressionadoMenor = false;
        }
        if (keyboard.up(".")) { 
            pressionadoMaior = false;
        }

    }
    reposiciona_aviao()
}

//Função responsável por rotacionar o avião para a posição horizontal original
function reposiciona_aviao(){
    if (pressionadoDown == false && pressionadoUP == false){
        //Reposiciona tecla UP
        if(aviao_obj.fuselagem._estacionaria.rotation.x<0){
            aviao_obj.fuselagem._estacionaria.rotation.x += anguloRot/2;
            if(aviao_obj.fuselagem._estacionaria.rotation.x>=0){
                aviao_obj.fuselagem._estacionaria.rotation.x = 0;
                vetVel[0] = 0;
            }
        }
        //Reposiciona tecla DOWN
        else if(aviao_obj.fuselagem._estacionaria.rotation.x>0){
            aviao_obj.fuselagem._estacionaria.rotation.x -= anguloRot/2;
            if(aviao_obj.fuselagem._estacionaria.rotation.x<=0){
                aviao_obj.fuselagem._estacionaria.rotation.x = 0;
                vetVel[0] = 0;
            }
        }
    }
    if (pressionadoLeft == false && pressionadoRight == false){
        //Reposiciona tecla LEFT
        if(aviao_obj.fuselagem._estacionaria.rotation.y<0){
            aviao_obj.fuselagem._estacionaria.rotation.y += anguloRot;
            if(aviao_obj.fuselagem._estacionaria.rotation.y>=0){
                aviao_obj.fuselagem._estacionaria.rotation.y = 0;
                vetVel[1] = 0;
            }
        }
        //Reposiciona tecla RIGHT
        else if(aviao_obj.fuselagem._estacionaria.rotation.y>0){
            aviao_obj.fuselagem._estacionaria.rotation.y -= anguloRot;
            if(aviao_obj.fuselagem._estacionaria.rotation.y<=0){
                aviao_obj.fuselagem._estacionaria.rotation.y = 0;
                vetVel[1] = 0;
            }
        } 
    }
    if(tipoCamera){ // Se estiver no modo inspeção ele volta pra origem
        aviao_obj.fuselagem._estacionaria.rotation.x = 0;
        aviao_obj.fuselagem._estacionaria.rotation.y = 0;
    }
}

// Funções responsavel por manter o movimento do aviao e rotacionar as helices
function mantem_velocidade() {
    aviao_obj.fuselagem._estacionaria.translateY(-velocidade);

    //Rotacionar as Helices
    //aviao_obj.fuselagem._movel.cone_motor.
}


// Enable Shadows in the Renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
buildInterface();
render();

function render() {
    stats.update(); // Update FPS
    keyboardUpdate();
    requestAnimationFrame(render);
    //renderer.setClearColor("rgb(150,200,220)");
    renderer.render(scene, camera); // Render scene
    if (tipoCamera) {
        trackballControls.update();
    } else {
        mantem_velocidade();
        mudaCamera();
    }
}
