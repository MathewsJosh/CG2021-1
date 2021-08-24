import * as THREE from "../build/three.module.js";
import Stats from "../build/jsm/libs/stats.module.js";
import {TrackballControls} from "../build/jsm/controls/TrackballControls.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import {ConvexGeometry} from '../build/jsm/geometries/ConvexGeometry.js'; // importante
import {GLTFLoader} from '../build/jsm/loaders/GLTFLoader.js';
import {MTLLoader} from '../build/jsm/loaders/MTLLoader.js';
import {OBJLoader} from '../build/jsm/loaders/OBJLoader.js'; 
import {initRenderer,
        InfoBox,
        createGroundPlane,
        SecondaryBox,
        onWindowResize,
        degreesToRadians} from "../libs/util/util.js";

var stats = new Stats(); // To show FPS information
var scene = new THREE.Scene(); // Create main scene
var renderer = initRenderer(); // View function in util/utils
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000);

// Inicia o carregamento de texturas
var textureLoader = new THREE.TextureLoader();

// Painel de FPS
function createStats() {
    stats.setMode(0);
    
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0';
    stats.domElement.style.top = '0';
  
    return stats;
  }
  // To show FPS
  stats = createStats();
  document.body.appendChild( stats.domElement );


//============================================ FLIGHT SIMULATOR - Trabalho 01 ============================================
//========================================================================================================================

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
        materiais : {}
    },
    ponto: new THREE.Vector3(0, 0, 0),
    velocidade_Max: 20,
    velocidade_atual: 0,
    aceleracao: 0.02,
    velocidade_nivelamento: 0.01,
    velocidade_Animacao: 0.02
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
    var casco = new THREE.MeshPhongMaterial({color: 0xffffff, shininess:"100", side: THREE.DoubleSide});
    var metal_cilindro = new THREE.MeshPhongMaterial({color: 0x700202, shininess:"100", side: THREE.DoubleSide}); //595959
    var metal_cinza = new THREE.MeshPhongMaterial({color: 0xa6a2a2, shininess:"100", side: THREE.DoubleSide}); //595959
    var metal_ouro = new THREE.MeshPhongMaterial({color: 0xe1d663, shininess:"100", side: THREE.DoubleSide});
    var tinta_azul = new THREE.MeshPhongMaterial({color: 0x0031e7, shininess:"100", side: THREE.DoubleSide}); //0031e7
    var tinta_cone = new THREE.MeshPhongMaterial({color: 0x585e5a, shininess:"100", side: THREE.DoubleSide}); //0031e7
    var casco_degradado = new THREE.MeshPhongMaterial({color: 0xc0c0c0, shininess:"100", side: THREE.DoubleSide});

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
    cabine.castShadow=true;
    fuselagem_objeto.add(cabine);
    // Setando os valores na variavel
    fuselagem.fuselagem._estacionaria = cabine;
    fuselagem.fuselagem._estacionaria.position.set(fuselagem.ponto.x, fuselagem.ponto.y, fuselagem.ponto.z);

    // Rabo
    var rabeta_geomeria = new THREE.CylinderGeometry(0.5, 1.5, 10, 50);
    var rabeta = new THREE.Mesh(rabeta_geomeria, casco);
    rabeta.castShadow = true;
    fuselagem_objeto.add(rabeta);
    rabeta.position.set(cabine.position.x, cabine.position.y + cabine.geometry.parameters.height, cabine.position.z);

    // Leme
    var leme_geometria = new THREE.BoxGeometry(2, 2, 0.35);
    var leme_dir = new THREE.Mesh();
    var leme_esq = new THREE.Mesh();
    var leme_cima = new THREE.Mesh();
    leme_dir.castShadow = true;
    leme_esq.castShadow = true;
    leme_cima.castShadow = true; 
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
    asa_prancha.castShadow = true;
    // Cima
    var asa_cima = new THREE.Mesh();
    cabine.add(asa_cima);
    asa_cima.position.set(0, 1, cabine_geometria.parameters.radiusTop + 2.2);
    asa_cima.castShadow = true;

    // Baixo
    var asa_baixo = new THREE.Mesh();
    cabine.add(asa_baixo);
    asa_baixo.position.set(0, asa_cima.position.y, - cabine_geometria.parameters.radiusTop / 2);
    asa_baixo.castShadow = true;

    // Enfeites
    // Geometria dos aredondados
    var cilindro_geomeria_dir = new THREE.CylinderGeometry(asa_prancha.parameters.height / 2, asa_prancha.parameters.height / 2, 0.2, 30, 1, false, Math.PI, Math.PI);
    var cilindro_geomeria_esq = new THREE.CylinderGeometry(asa_prancha.parameters.height / 2, asa_prancha.parameters.height / 2, 0.2, 30, 1, false, 0, Math.PI);

    // Arredondados na asa cima
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
    cilindro_esq_asa_baixo.castShadow = true;
    cilindro_dir_asa_baixo.castShadow = true;
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
    cilindro_enfeite01.position.set(0, - asa_prancha.parameters.height / 2 + cilindro_enfeite_geometria.parameters.radiusBottom / 2-0.01, 0);

    var cilindro_enfeite02 = new THREE.Mesh(cilindro_enfeite_geometria, metal_cinza);
    asa_baixo.add(cilindro_enfeite02);
    cilindro_enfeite02.rotateZ(Math.PI / 2);
    cilindro_enfeite02.position.set(0, - asa_prancha.parameters.height / 2 + cilindro_enfeite_geometria.parameters.radiusBottom / 2, 0);

    var cilindro_apoio_geometria = new THREE.CylinderGeometry(0.15, 0.15, Math.abs(asa_cima.position.z - asa_baixo.position.z), 30);
    // Direito
    var cilindro_apoio01 = new THREE.Mesh(cilindro_apoio_geometria, metal_cilindro);
    asa_cima.add(cilindro_apoio01);
    cilindro_apoio01.rotateX(Math.PI / 2);
    cilindro_apoio01.position.set(- cabine_geometria.parameters.radiusBottom - 1, 1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    var cilindro_apoio02 = new THREE.Mesh(cilindro_apoio_geometria, metal_cilindro);
    asa_cima.add(cilindro_apoio02);
    cilindro_apoio02.rotateX(Math.PI / 2);
    cilindro_apoio02.position.set(- cabine_geometria.parameters.radiusBottom - 1, -1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    var cilindro_apoio03 = new THREE.Mesh(cilindro_apoio_geometria, metal_cilindro);
    asa_cima.add(cilindro_apoio03);
    cilindro_apoio03.rotateX(Math.PI / 2);
    cilindro_apoio03.position.set(- cabine_geometria.parameters.radiusBottom - asa_prancha.parameters.width / 2 + 2, 1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    var cilindro_apoio04 = new THREE.Mesh(cilindro_apoio_geometria, metal_cilindro);
    asa_cima.add(cilindro_apoio04);
    cilindro_apoio04.rotateX(Math.PI / 2);
    cilindro_apoio04.position.set(- cabine_geometria.parameters.radiusBottom - asa_prancha.parameters.width / 2 + 2, -1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    // Esquerda
    var cilindro_apoio05 = new THREE.Mesh(cilindro_apoio_geometria, metal_cilindro);
    asa_cima.add(cilindro_apoio05);
    cilindro_apoio05.rotateX(Math.PI / 2);
    cilindro_apoio05.position.set(cabine_geometria.parameters.radiusBottom + 1, 1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    var cilindro_apoio06 = new THREE.Mesh(cilindro_apoio_geometria, metal_cilindro);
    asa_cima.add(cilindro_apoio06);
    cilindro_apoio06.rotateX(Math.PI / 2);
    cilindro_apoio06.position.set(cabine_geometria.parameters.radiusBottom + 1, -1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    var cilindro_apoio07 = new THREE.Mesh(cilindro_apoio_geometria, metal_cilindro);
    asa_cima.add(cilindro_apoio07);
    cilindro_apoio07.rotateX(Math.PI / 2);
    cilindro_apoio07.position.set(cabine_geometria.parameters.radiusBottom + asa_prancha.parameters.width / 2 - 2, 1, -Math.abs(asa_cima.position.z - asa_baixo.position.z) / 2);

    var cilindro_apoio08 = new THREE.Mesh(cilindro_apoio_geometria, metal_cilindro);
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
    cilindro_apoio45_01.rotateZ(Math.PI / 2.9);
    cilindro_apoio45_01.position.set(-1 - cabine_geometria.parameters.radiusBottom - Math.abs(cilindro_apoio01.position.x - cilindro_apoio03.position.x) / 2, cilindro_apoio01.position.y, cilindro_apoio01.position.z);

    var cilindro_apoio45_02 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_02);
    cilindro_apoio45_02.rotateX(Math.PI / 2);
    cilindro_apoio45_02.rotateZ(-Math.PI / 2.9);
    cilindro_apoio45_02.position.set(-1 - cabine_geometria.parameters.radiusBottom - Math.abs(cilindro_apoio01.position.x - cilindro_apoio03.position.x) / 2, cilindro_apoio01.position.y, cilindro_apoio01.position.z);

    // Frente
    var cilindro_apoio45_03 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_03);
    cilindro_apoio45_03.rotateX(Math.PI / 2);
    cilindro_apoio45_03.rotateZ(Math.PI / 2.9);
    cilindro_apoio45_03.position.set(-1 - cabine_geometria.parameters.radiusBottom - Math.abs(cilindro_apoio02.position.x - cilindro_apoio04.position.x) / 2, cilindro_apoio02.position.y, cilindro_apoio02.position.z);

    var cilindro_apoio45_04 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_04);
    cilindro_apoio45_04.rotateX(Math.PI / 2);
    cilindro_apoio45_04.rotateZ(-Math.PI / 2.9);
    cilindro_apoio45_04.position.set(-1 - cabine_geometria.parameters.radiusBottom - Math.abs(cilindro_apoio02.position.x - cilindro_apoio04.position.x) / 2, cilindro_apoio02.position.y, cilindro_apoio02.position.z);

    // Esquerda
    // Atras
    var cilindro_apoio45_05 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_05);
    cilindro_apoio45_05.rotateX(Math.PI / 2);
    cilindro_apoio45_05.rotateZ(Math.PI / 2.9);
    cilindro_apoio45_05.position.set(1 + cabine_geometria.parameters.radiusBottom + Math.abs(cilindro_apoio05.position.x - cilindro_apoio07.position.x) / 2, cilindro_apoio05.position.y, cilindro_apoio05.position.z);

    var cilindro_apoio45_02 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_02);
    cilindro_apoio45_02.rotateX(Math.PI / 2);
    cilindro_apoio45_02.rotateZ(-Math.PI / 2.9);
    cilindro_apoio45_02.position.set(1 + cabine_geometria.parameters.radiusBottom + Math.abs(cilindro_apoio05.position.x - cilindro_apoio07.position.x) / 2, cilindro_apoio05.position.y, cilindro_apoio05.position.z);

    // Frente
    var cilindro_apoio45_03 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_03);
    cilindro_apoio45_03.rotateX(Math.PI / 2);
    cilindro_apoio45_03.rotateZ(Math.PI / 2.9);
    cilindro_apoio45_03.position.set(1 + cabine_geometria.parameters.radiusBottom + Math.abs(cilindro_apoio06.position.x - cilindro_apoio08.position.x) / 2, cilindro_apoio06.position.y, cilindro_apoio06.position.z);

    var cilindro_apoio45_04 = new THREE.Mesh(cilindro_apoio_45_geometria, metal_ouro);
    asa_cima.add(cilindro_apoio45_04);
    cilindro_apoio45_04.rotateX(Math.PI / 2);
    cilindro_apoio45_04.rotateZ(-Math.PI / 2.9);
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
    var protecao_geometria = new THREE.TorusGeometry(cabine_geometria.parameters.radiusBottom, cabine_geometria.parameters.radiusBottom / 5, 30, 6);
    var protecao = new THREE.Mesh(protecao_geometria, metal_cinza);
    
    cabine.add(protecao);
    protecao.rotateX(Math.PI / 2);
    protecao.position.set(0, - cabine_geometria.parameters.height / 2, 0);

    var cone_motor_geometria = new THREE.ConeGeometry(cabine_geometria.parameters.radiusBottom, 1, 30);
    var cone_motor = new THREE.Mesh(cone_motor_geometria, tinta_cone);
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

    protecao.castShadow = true;
    cone_motor.castShadow = true;
    pa01.castShadow = true;
    pa02.castShadow = true;
    pa03.castShadow = true;
    pa04.castShadow = true;

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
    flap_asa_direita_baixo.castShadow = true;

    var flap_asa_esquerda_baixo = new THREE.Mesh(flap_asa_geometria, casco_degradado);
    asa_baixo.add(flap_asa_esquerda_baixo);
    flap_asa_esquerda_baixo.position.set(asa_prancha.parameters.width / 2 - flap_asa_geometria.parameters.width / 2, asa_prancha.parameters.height / 2 - flap_asa_geometria.parameters.height / 2, 0);
    flap_asa_esquerda_baixo.castShadow = true;
    
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
    asa_meio_baixo.castShadow = true;

    var asa_frente_baixo = new THREE.Mesh(asa_frente_geometria, casco);
    asa_baixo.add(asa_frente_baixo);
    asa_frente_baixo.position.set(0, - flap_asa_geometria.parameters.height / 2, 0);
    asa_frente_baixo.castShadow = true;

    // Leme
    var flap_leme_geometria = new THREE.BoxGeometry(leme_geometria.parameters.height * 0.5, leme_geometria.parameters.width / 3, leme_geometria.parameters.depth);

    var flap_leme_dir = new THREE.Mesh(flap_leme_geometria, casco_degradado);
    leme_dir.add(flap_leme_dir);
    flap_leme_dir.position.set(- flap_leme_geometria.parameters.width / 2, flap_leme_geometria.parameters.height, 0);
    flap_leme_dir.castShadow = true;

    var flap_leme_esq = new THREE.Mesh(flap_leme_geometria, casco_degradado);
    leme_esq.add(flap_leme_esq);
    flap_leme_esq.position.set(flap_leme_geometria.parameters.width / 2, flap_leme_geometria.parameters.height, 0);
    flap_leme_esq.castShadow = true;

    var flap_leme_cima = new THREE.Mesh(flap_leme_geometria, casco_degradado);
    leme_cima.add(flap_leme_cima);
    flap_leme_cima.position.set(- flap_leme_geometria.parameters.height, flap_leme_geometria.parameters.width / 2, 0);
    flap_leme_cima.rotateZ(Math.PI / 2);
    flap_leme_cima.castShadow = true;

    // Leme dividido
    var leme_meio_geometria = new THREE.BoxGeometry(leme_geometria.parameters.height * 0.3, leme_geometria.parameters.width / 3, leme_geometria.parameters.depth);
    var leme_frente_geometria = new THREE.BoxGeometry(leme_geometria.parameters.height, (2 * leme_geometria.parameters.width) / 3, leme_geometria.parameters.depth);

    // Direito
    var leme_dir_meio = new THREE.Mesh(leme_meio_geometria, casco);
    leme_dir.add(leme_dir_meio);
    leme_dir_meio.position.set(leme_meio_geometria.parameters.width / 2, leme_meio_geometria.parameters.height, 0);
    leme_dir_meio.castShadow = true;

    var leme_dir_frente = new THREE.Mesh(leme_frente_geometria, casco);
    leme_dir.add(leme_dir_frente);
    leme_dir_frente.position.set(0, - leme_meio_geometria.parameters.height / 2, 0);
    leme_dir_frente.castShadow = true;
    // # fuselagem.fuselagem._movel = { conjunto_flap_direito : flap_leme_dir}

    // Esquerdo
    var leme_esq_meio = new THREE.Mesh(leme_meio_geometria, casco);
    leme_esq.add(leme_esq_meio);
    leme_esq_meio.position.set(- leme_meio_geometria.parameters.width / 2, leme_meio_geometria.parameters.height, 0);
    leme_esq_meio.castShadow = true;

    var leme_esq_frente = new THREE.Mesh(leme_frente_geometria, casco);
    leme_esq.add(leme_esq_frente);
    leme_esq_frente.position.set(0, - leme_meio_geometria.parameters.height / 2, 0);
    leme_esq_frente.castShadow = true;
    // # fuselagem.fuselagem._movel = { conjunto_flap_esquerdo : flap_leme_esq}

    // Meio
    var leme_cima_meio = new THREE.Mesh(leme_meio_geometria, casco);
    leme_cima.add(leme_cima_meio);
    leme_cima_meio.position.set(- leme_meio_geometria.parameters.height, - flap_leme_geometria.parameters.width * 0.3, 0);
    leme_cima_meio.rotateZ(Math.PI / 2);
    leme_cima_meio.castShadow = true;

    var leme_cima_frente = new THREE.Mesh(leme_frente_geometria, casco);
    leme_cima.add(leme_cima_frente);
    leme_cima_frente.position.set(leme_meio_geometria.parameters.height / 2, 0, 0);
    leme_cima_frente.rotateZ(Math.PI / 2);
    // # fuselagem.fuselagem._movel = { leme_meio : flap_leme_cima}



    //------------ Trabalho 03 - Parte 1 - Mapeamento de textura do avião -----------
    //-------------------------------------------------------------------------------
    //-- Use TextureLoader to load texture files
    var lataria1 = textureLoader.load('texturas\\lataria\\lataria1.jpg');
    var lataria2 = textureLoader.load('texturas\\lataria\\lataria2.jpg');
    var lataria3 = textureLoader.load('texturas\\lataria\\lataria3.jpg');
    var lataria4 = textureLoader.load('texturas\\lataria\\lataria4.jpg');

    //cilindro_enfeite01.material.map = lataria1;
    cilindro_apoio01.material.map = lataria1;
    cilindro_apoio01.anisotropy = renderer.capabilities.getMaxAnisotropy();
    cilindro_apoio01.material.map.wrapS = THREE.RepeatWrapping;
    cilindro_apoio01.material.map.wrapT = THREE.RepeatWrapping;
    // cilindro_apoio01.material.map.minFilter = THREE.LinearFilter;
    // cilindro_apoio01.material.map.magFilter = THREE.LinearFilter;

    cilindro_apoio45_01.material.map = lataria2;
    cilindro_apoio45_01.anisotropy = renderer.capabilities.getMaxAnisotropy();
    cilindro_apoio45_01.material.map.wrapS = THREE.RepeatWrapping;
    cilindro_apoio45_01.material.map.wrapT = THREE.RepeatWrapping;
    // cilindro_apoio45_01.material.map.minFilter = THREE.LinearFilter;
    // cilindro_apoio45_01.material.map.magFilter = THREE.LinearFilter;

    cabine.material.map = lataria3;
    cabine.anisotropy = renderer.capabilities.getMaxAnisotropy();
    cabine.material.map.wrapS = THREE.RepeatWrapping;
    cabine.material.map.wrapT = THREE.RepeatWrapping;
    // cabine.material.map.minFilter = THREE.NearestFilter;
    // cabine.material.map.magFilter = THREE.NearestFilter;

    flap_asa_esquerda_cima.material.map = lataria3;
    flap_asa_esquerda_cima.anisotropy = renderer.capabilities.getMaxAnisotropy();
    flap_asa_esquerda_cima.material.map.wrapS = THREE.RepeatWrapping;
    flap_asa_esquerda_cima.material.map.wrapT = THREE.RepeatWrapping;
    // flap_asa_esquerda_cima.material.map.minFilter = THREE.LinearFilter;
    // flap_asa_esquerda_cima.material.map.magFilter = THREE.LinearFilter;


    pa01.material.map = lataria4;
    pa01.anisotropy = renderer.capabilities.getMaxAnisotropy();
    pa01.material.map.wrapS = THREE.RepeatWrapping;
    pa01.material.map.wrapT = THREE.RepeatWrapping;
    // pa01.material.map.minFilter = THREE.LinearFilter;
    // pa01.material.map.magFilter = THREE.LinearFilter;


    cone_motor.material.map = lataria4;
    cone_motor.anisotropy = renderer.capabilities.getMaxAnisotropy();
    cone_motor.material.map.wrapS = THREE.RepeatWrapping;
    cone_motor.material.map.wrapT = THREE.RepeatWrapping;
    // cone_motor.material.map.minFilter = THREE.LinearFilter;
    // cone_motor.material.map.magFilter = THREE.LinearFilter;



    // Adiçao dos grupos moveis
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
aviao_obj.fuselagem._estacionaria.castShadow = true;
aviao_obj.fuselagem._estacionaria.receiveShadow = true;
aviao_obj.fuselagem._estacionaria.name = "aviao";

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

// Cria um plano que recebe sombras
var plano = createGroundPlane(10000, 10000, 40, 40); // width, height, resolutionW, resolutionH
plano.material.color.r = 0
plano.material.color.g = 199/255
plano.material.color.b = 27/255
scene.add(plano);
plano.receiveShadow = true;

//------------------- Trabalho 03 - Parte 3 - Textura do chão ------------------
//------------------------------------------------------------------------------
//-- Use TextureLoader to load texture files
var chao1 = textureLoader.load('texturas\\chao\\chao1.jpg');
plano.material.map = chao1;
plano.material.map.repeat.set(20, 20);
plano.material.map.wrapS = THREE.RepeatWrapping;
plano.material.map.wrapT = THREE.RepeatWrapping;

// Cria uma variável para cuidar da mudança de tipo de câmera
var keyboard = new KeyboardState();


//================================== Configurações de camera ==================================
// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement);
//trackballControls.noPan = true;
// Camera padrão
camera.position.set(
    aviao_obj.fuselagem._estacionaria.position.x, 
    aviao_obj.fuselagem._estacionaria.position.y-80.0, 
    aviao_obj.fuselagem._estacionaria.position.z+20.0);

camera.lookAt(aviao_obj.fuselagem._estacionaria.position.x,
    aviao_obj.fuselagem._estacionaria.position.y,
    aviao_obj.fuselagem._estacionaria.position.z);

var isSimulacao = true;  // true => Modo de Inspeção || false => Simulação

// CameraHolder
var cameraHolder = new THREE.Object3D();
cameraHolder.add(camera)
scene.add(cameraHolder);

var controls = new InfoBox();
function buildInterface() { // Mostrando as informações na tela
    controls.add("Simulador de voo - Controles");
    controls.addParagraph(); // Setas:https://textkool.com/pt/symbols/arrows-symbols
    controls.add("# Q  /  A - Acelera/Freia");
    controls.add("# ↥  /  ↧ - Sobe/Desce o bico do avião");
    controls.add("# ↤ /  ↦ - Vira para Esquerda/Direita");
    controls.add("#  SPACE  - Camera em Inspeção/Simulador");
    controls.addParagraph()
    controls.add("#  ENTER  - Camera em Inspeção/Simulador");
    controls.add("# C - Camera no modo cockpit");
    controls.add("# H - Exibe/Desabilita instruções");

    controls.show();
}

//Variaveis que salvam a posição do avião
var aviao_auxiliar = {
    position: { x:aviao_obj.fuselagem._estacionaria.position.x, 
        y:aviao_obj.fuselagem._estacionaria.position.y, 
        z:aviao_obj.fuselagem._estacionaria.position.z
    },
    rotation: { x:aviao_obj.fuselagem._estacionaria.rotation.x, 
        y:aviao_obj.fuselagem._estacionaria.rotation.y, 
        z:aviao_obj.fuselagem._estacionaria.rotation.z
    }
}

var camera_auxiliar = {
    position: { x: camera.position.x, 
        y: camera.position.y, 
        z: camera.position.z
    },
    rotation: { x: camera.rotation.x, 
        y: camera.rotation.y, 
        z: camera.rotation.z
    },
    up:{ x: camera.up.x, 
        y: camera.up.y, 
        z: camera.up.z
    }
}

var cameraHolder_auxiliar = {
    position: { x: cameraHolder.position.x, 
        y: cameraHolder.position.y, 
        z: cameraHolder.position.z
    },
    rotation: { x: cameraHolder.rotation.x, 
        y: cameraHolder.rotation.y, 
        z: cameraHolder.rotation.z
    }
}


// Muda e controla o comportamento das cameras
function mudaCamera() { //Muda a camera toda
    if (!isSimulacao) {// Mudança da simulação para a inspeção
        ambienteS.pause();
        airplaneS.pause();
        // Salva os valores de posição vindos da simulação
        aviao_auxiliar.position.x = aviao_obj.fuselagem._estacionaria.position.x
        aviao_auxiliar.position.y = aviao_obj.fuselagem._estacionaria.position.y
        aviao_auxiliar.position.z = aviao_obj.fuselagem._estacionaria.position.z
        
        camera_auxiliar.position.x = camera.position.x
        camera_auxiliar.position.y = camera.position.y
        camera_auxiliar.position.z = camera.position.z
        
        cameraHolder_auxiliar.position.x = cameraHolder.position.x
        cameraHolder_auxiliar.position.y = cameraHolder.position.y
        cameraHolder_auxiliar.position.z = cameraHolder.position.z

        // Salva os valores de rotação vindos da simulação
        aviao_auxiliar.rotation.x = aviao_obj.fuselagem._estacionaria.rotation.x
        aviao_auxiliar.rotation.y = aviao_obj.fuselagem._estacionaria.rotation.y
        aviao_auxiliar.rotation.z = aviao_obj.fuselagem._estacionaria.rotation.z
        
        camera_auxiliar.rotation.x = camera.rotation.x
        camera_auxiliar.rotation.y = camera.rotation.y
        camera_auxiliar.rotation.z = camera.rotation.z
        
        cameraHolder_auxiliar.rotation.x = cameraHolder.rotation.x
        cameraHolder_auxiliar.rotation.y = cameraHolder.rotation.y
        cameraHolder_auxiliar.rotation.z = cameraHolder.rotation.z

        // Salva os valores de up vindos da camera na simulação
        camera_auxiliar.up.x = camera.up.x
        camera_auxiliar.up.y = camera.up.y
        camera_auxiliar.up.z = camera.up.z

        // Reposiciona o avião no centro da cena
        aviao_obj.fuselagem._estacionaria.position.set(0,0,0)
        aviao_obj.fuselagem._estacionaria.rotation.set(0,0,Math.PI)

        cameraHolder.position.set(0,0,0)
        cameraHolder.rotation.set(0,0,0)

        camera.position.set(0,-80,20)
        camera.rotation.set(Math.PI/2,0,0)
        camera.up.set(0,1,0)
    }else{// Mudança da inspeção para a simulação  
        ambienteS.play();
        airplaneS.play();

        //loadOBJFile('../assets/objects/', 'plane', 3, 0, true);
        //loadOBJFile("objetos\\Statue_v1\\", "Statue", 3, 0, true)


        // Pega os valores salvos no item anterior para tirar o avião da origem
        aviao_obj.fuselagem._estacionaria.position.set(
            aviao_auxiliar.position.x,
            aviao_auxiliar.position.y,
            aviao_auxiliar.position.z
        )

        aviao_obj.fuselagem._estacionaria.rotation.set(
            aviao_auxiliar.rotation.x,
            aviao_auxiliar.rotation.y,
            aviao_auxiliar.rotation.z
        )
        
        // Reposiciona a camera e o cameraHolder a partir dos valores salvos anteriormente
        cameraHolder.position.set(
            cameraHolder_auxiliar.position.x,
            cameraHolder_auxiliar.position.y,
            cameraHolder_auxiliar.position.z
        )

        cameraHolder.rotation.set(
            cameraHolder_auxiliar.rotation.x,
            cameraHolder_auxiliar.rotation.y,
            cameraHolder_auxiliar.rotation.z
        )

        camera.position.set(
            camera_auxiliar.position.x,
            camera_auxiliar.position.y,
            camera_auxiliar.position.z
        )

        camera.rotation.set(
            camera_auxiliar.rotation.x,
            camera_auxiliar.rotation.y,
            camera_auxiliar.rotation.z
        )

        camera.up.set(
            camera_auxiliar.up.x,
            camera_auxiliar.up.y,
            camera_auxiliar.up.z
        )
    }

    isSimulacao = !isSimulacao
}


//============================= Configurações de Movimentação =============================
// Controle de botões pressionados
var pressionadoUP = false;
var pressionadoDown = false;
var pressionadoLeft = false;
var pressionadoRight = false;
var pressionadoC = false;
var pressionadoSpace = false;
var pressionadoH = false;

function controlaVisibilidade(visivel){
    aviao_obj.fuselagem._estacionaria.visible = true;
    for(var i=0; i<scene.children.length; i++){
        if (scene.children[i].name!="aviao" && scene.children[i].name!="hemisphereLight" && scene.children[i].name!="dirligh" && scene.children[i].name!="curve")
            scene.children[i].visible = visivel;
    }
}

// Função de controle das entradas do teclado
function keyboardUpdate() {
    keyboard.update();

    // Muda o tipo de câmera
    if(!pressionadoC){
        if (keyboard.down("space")) {
            controlaVisibilidade(true);
            pressionadoSpace = !pressionadoSpace;
            if(pressionadoSpace!=false)
                curveObject.visible = true;
            mudaCamera();
            if(isSimulacao)
                curveObject.visible = false;
        }
    }

    // Tecla de Debug para testes
    
    if (keyboard.up("D")) {
    }

    //Oculta as instruções
    if (keyboard.down("H")){
        var y = document.getElementById("InfoxBox");
        pressionadoH = !pressionadoH;
        if (pressionadoH){
            y.style.display = 'none';
        }
        else{
            y.style.display = 'block';
        }
    }

    // Exibe a linha do percurso
    if (keyboard.down("enter")) { // Mostra o caminho                                           //FLIGHT SCHOOL - T2
        curveObject.visible = !curveObject.visible;
    }

    // Acelera o avião e controla toda a movimentação
    if(!isSimulacao){
        if (keyboard.pressed("Q")) { // Aceleração progressiva
            if (aviao_obj.velocidade_atual < aviao_obj.velocidade_Max) {
                aviao_obj.velocidade_atual += aviao_obj.aceleracao;
            }
        }

        // Entra no modo cockpit
        if (keyboard.down("C")) { //Modo Cockpit                                             //FLIGHT SCHOOL - T2
            pressionadoC = !pressionadoC;
            if(pressionadoC){
                airplaneS.setVolume(1)
                entraCockpit();
            }
            else{
                airplaneS.setVolume(0.3)
                saiCockpit();
            }

        }

        // Movimentação só caso tenha velocidade
        if (aviao_obj.velocidade_atual > 0) { // Movimentação
            if (keyboard.pressed("A")) { // Desaceleração progressiva
                if (aviao_obj.velocidade_atual > 0) {
                    aviao_obj.velocidade_atual -= aviao_obj.aceleracao;
                }else{
                    aviao_obj.velocidade_atual = 0;
                }
            }

            if (keyboard.pressed("up")) { // Desce o bico do avião
                pressionadoUP = true;
                aviao_obj.fuselagem._estacionaria.rotateX(aviao_obj.velocidade_nivelamento)
                cameraHolder.rotateX(-aviao_obj.velocidade_nivelamento)
            }
            
            if (keyboard.pressed("down")) { // Sobe o bico do avião
                pressionadoDown = true;
                aviao_obj.fuselagem._estacionaria.rotateX(-aviao_obj.velocidade_nivelamento)
                cameraHolder.rotateX(aviao_obj.velocidade_nivelamento)
            }

            
            if (keyboard.pressed("left")) { // Gira para esquerda
                pressionadoLeft = true;
                aviao_obj.fuselagem._estacionaria.rotateZ(aviao_obj.velocidade_nivelamento)
                cameraHolder.rotateZ(aviao_obj.velocidade_nivelamento)
            }
            if (keyboard.pressed("right")) { // Gira para direita
                pressionadoRight = true;
                aviao_obj.fuselagem._estacionaria.rotateZ(-aviao_obj.velocidade_nivelamento)
                cameraHolder.rotateZ(-aviao_obj.velocidade_nivelamento)
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
            restart_Eixos()
        }
    }
    cameraHolder.position.set(aviao_obj.fuselagem._estacionaria.position.x, aviao_obj.fuselagem._estacionaria.position.y, aviao_obj.fuselagem._estacionaria.position.z);
}

// Nivela o avião
function restart_Eixos() {
    if (pressionadoDown == false && pressionadoUP == false){
        // Reposiciona tecla UP
        if(aviao_obj.fuselagem._estacionaria.rotation.x < 0){
            aviao_obj.fuselagem._estacionaria.rotation.x += aviao_obj.velocidade_nivelamento/2
            cameraHolder.rotation.x += aviao_obj.velocidade_nivelamento/2
            if (aviao_obj.fuselagem._estacionaria.rotation.x >= 0) {
                aviao_obj.fuselagem._estacionaria.rotation.x = 0
                cameraHolder.rotation.x = 0
            }
        }
        // Reposiciona tecla DOWN
        else if(aviao_obj.fuselagem._estacionaria.rotation.x > 0){
            aviao_obj.fuselagem._estacionaria.rotation.x -= aviao_obj.velocidade_nivelamento/2
            cameraHolder.rotation.x -= aviao_obj.velocidade_nivelamento/2
            if (aviao_obj.fuselagem._estacionaria.rotation.x <= 0) {
                aviao_obj.fuselagem._estacionaria.rotation.x = 0
                cameraHolder.rotation.x = 0
            }
        }

        // Reposiciona tecla Lateral
        if(aviao_obj.fuselagem._estacionaria.rotation.y < 0){
            aviao_obj.fuselagem._estacionaria.rotation.y += aviao_obj.velocidade_nivelamento/2
            cameraHolder.rotation.y += aviao_obj.velocidade_nivelamento/2
            if (aviao_obj.fuselagem._estacionaria.rotation.y >= 0) {
                aviao_obj.fuselagem._estacionaria.rotation.y = 0
                cameraHolder.rotation.y = 0
            }
        }

        // Reposiciona tecla Lateral
        else if(aviao_obj.fuselagem._estacionaria.rotation.y > 0){
            aviao_obj.fuselagem._estacionaria.rotation.y -= aviao_obj.velocidade_nivelamento/2
            cameraHolder.rotation.y -= aviao_obj.velocidade_nivelamento/2
            if (aviao_obj.fuselagem._estacionaria.rotation.y <= 0) {
                aviao_obj.fuselagem._estacionaria.rotation.y = 0
                cameraHolder.rotation.y = 0
            }
        }
    }
}

//Faz o movimento do avião e ativa a rotação dos flaps e leme ao pressionar diferentes teclas
function movimento() {
    if (aviao_obj.velocidade_atual > 0) {
        var velmotor = aviao_obj.velocidade_atual/2;
        aviao_obj.fuselagem._estacionaria.translateY(-aviao_obj.velocidade_atual)
        if(aviao_obj.velocidade_atual>=Math.PI/2)
            velmotor=Math.PI/3;
        aviao_obj.fuselagem._movel.motor.rotateY(velmotor)
    }

    if (pressionadoUP) { // Desce o bico do avião
        if (aviao_obj.fuselagem._movel.conjunto_flap_direito.cima.rotation.x < 0.45) {
            aviao_obj.fuselagem._movel.conjunto_flap_direito.cima.rotateX(aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_direito.baixo.rotateX(aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_direito.atras.rotateX(aviao_obj.velocidade_Animacao)

            aviao_obj.fuselagem._movel.conjunto_flap_esquerdo.cima.rotateX(aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_esquerdo.baixo.rotateX(aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_esquerdo.atras.rotateX(aviao_obj.velocidade_Animacao)
        }
    }else{
        if (aviao_obj.fuselagem._movel.conjunto_flap_direito.cima.rotation.x > 0) {
            aviao_obj.fuselagem._movel.conjunto_flap_direito.cima.rotateX(-aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_direito.baixo.rotateX(-aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_direito.atras.rotateX(-aviao_obj.velocidade_Animacao)
            
            aviao_obj.fuselagem._movel.conjunto_flap_esquerdo.cima.rotateX(-aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_esquerdo.baixo.rotateX(-aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_esquerdo.atras.rotateX(-aviao_obj.velocidade_Animacao)
        }
    }
    
    if (pressionadoDown) { // Sobe o bico do avião
        if (aviao_obj.fuselagem._movel.conjunto_flap_direito.cima.rotation.x > -0.45) {
            
            aviao_obj.fuselagem._movel.conjunto_flap_direito.cima.rotateX(-aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_direito.baixo.rotateX(-aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_direito.atras.rotateX(-aviao_obj.velocidade_Animacao)
            
            aviao_obj.fuselagem._movel.conjunto_flap_esquerdo.cima.rotateX(-aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_esquerdo.baixo.rotateX(-aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_esquerdo.atras.rotateX(-aviao_obj.velocidade_Animacao)
        }
    }else{
        if (aviao_obj.fuselagem._movel.conjunto_flap_direito.cima.rotation.x < 0) {
            aviao_obj.fuselagem._movel.conjunto_flap_direito.cima.rotateX(aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_direito.baixo.rotateX(aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_direito.atras.rotateX(aviao_obj.velocidade_Animacao)

            aviao_obj.fuselagem._movel.conjunto_flap_esquerdo.cima.rotateX(aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_esquerdo.baixo.rotateX(aviao_obj.velocidade_Animacao)
            aviao_obj.fuselagem._movel.conjunto_flap_esquerdo.atras.rotateX(aviao_obj.velocidade_Animacao)
        }
    }

    if (pressionadoLeft) { // Gira para esquerda
        if (aviao_obj.fuselagem._movel.leme_meio.rotation.y < 0.45) {
            aviao_obj.fuselagem._movel.leme_meio.rotateX(aviao_obj.velocidade_Animacao)
        }
    }else{
        if (aviao_obj.fuselagem._movel.leme_meio.rotation.y > 0) {
            aviao_obj.fuselagem._movel.leme_meio.rotateX(-aviao_obj.velocidade_Animacao)
        }
    }
    
    if (pressionadoRight) { // Gira para direita
        if (aviao_obj.fuselagem._movel.leme_meio.rotation.y > -0.45) {
            aviao_obj.fuselagem._movel.leme_meio.rotateX(-aviao_obj.velocidade_Animacao)
        }
    }else{
        if (aviao_obj.fuselagem._movel.leme_meio.rotation.y < 0) {
            aviao_obj.fuselagem._movel.leme_meio.rotateX(aviao_obj.velocidade_Animacao)
        }
    }
}


//============================================= FLIGHT SCHOOL - Trabalho 02 =============================================
//=======================================================================================================================


/**
 * Função Auxiliar para conseguir números randomicos em determinado intervalo
 * @param {*} min Valor min para random
 * @param {*} max Valor max para random
 * @returns retorna um valor randômico
 */
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
  }

//--- Trabalho 02 - Parte 1 - Caminhos, checkpoints e sistema para marcar tempo ----
//----------------------------------------------------------------------------------
// Pontos do circuito que será criada
var pontosDaLinha = 
[new THREE.Vector3( 0, 0, 0 ),                              //Origin
new THREE.Vector3( 0, getRandom(80,150), -800 ),            //1
new THREE.Vector3( 600, getRandom(150,350), -1200 ),         //2
new THREE.Vector3( -400, getRandom(100,200), -2000 ),        //3
new THREE.Vector3( -800, getRandom(200,450), -1600 ),        //4
new THREE.Vector3( -1000, getRandom(120,300), -1000 ),       //5
new THREE.Vector3( -800, getRandom(130,300), -800 ),        //6
new THREE.Vector3( 0, getRandom(140,300), 400),             //7
new THREE.Vector3( 800, getRandom(120,420), 200),              //8
new THREE.Vector3( 1600, getRandom(50,320), 800),           //9
new THREE.Vector3( 2400, getRandom(240,520), 1600),          //10
new THREE.Vector3( 800, getRandom(50,220), 1600),           //11
new THREE.Vector3( 0, getRandom(250,520), 1600),             //12
new THREE.Vector3( 0, getRandom(40,150), 500),              //13
new THREE.Vector3( 0, 0, 0 )]                               //end


//Cria uma curva a partir dos pontos definidos anteriormente
const curve = new THREE.CatmullRomCurve3(pontosDaLinha);
const curvepoints = curve.getPoints( 300 );
const curvegeometry = new THREE.BufferGeometry().setFromPoints( curvepoints);
const curvematerial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
const curveObject = new THREE.Line( curvegeometry, curvematerial );
curveObject.rotateX(Math.PI/2)
curveObject.visible = false;
curveObject.name = "curve";
scene.add(curveObject);


const checkpointgeometry = new THREE.TorusGeometry( 20, 2, 15, 100 );
const checkpointmaterial = new THREE.MeshBasicMaterial( { color: 0x8a6521, opacity: 0.8 , transparent: true } ); //0xfec2b8
var checkpoint = [];
/**
 * Cria os checkpoins com base na geometria Torus
 */
function defineCheckpoints(){
    for (var i=1, j=0; i<pontosDaLinha.length - 1; i++, j++){
        checkpoint[j] = new THREE.Mesh( checkpointgeometry, checkpointmaterial );
        checkpoint[j].position.x = pontosDaLinha[i].x;
        checkpoint[j].position.y = -pontosDaLinha[i].z;
        checkpoint[j].position.z = pontosDaLinha[i].y;
        checkpoint[j].lookAt(checkpoint[j].position);   //Eles "olham" para o centro, ou seja, eles vão estar melhor posicionados em relação a curva
        checkpoint[j].rotateX(Math.PI/2);
    }
}
defineCheckpoints()

//Deixa apenas o primeiro checkpoint visivel
scene.add(checkpoint[0])

//Conserta os checkpoints restantes que ainda não estão perpendiculares à curva
checkpoint[0].rotateY(-Math.PI/4)
checkpoint[2].rotateY(Math.PI/2)
checkpoint[6].rotateY(Math.PI/2)
checkpoint[7].rotateY(Math.PI/2)
checkpoint[8].rotateY(Math.PI/3)
checkpoint[10].rotateY(Math.PI/2)
checkpoint[11].rotateY(Math.PI/3)


var numeroDoCheck = 0;
/**
 * Verifica se um checkpoint foi atravessado
 */
function verificaCheckpoint(){
    if(numeroDoCheck<checkpoint.length){
        var raio = checkpointgeometry.parameters.radius;

        //Posições dos checkpoints
        var cx=checkpoint[numeroDoCheck].position.x;
        var cy=checkpoint[numeroDoCheck].position.y;
        var cz=checkpoint[numeroDoCheck].position.z;
        
        //Posições do avião
        var ax = aviao_obj.fuselagem._estacionaria.position.x;
        var ay = aviao_obj.fuselagem._estacionaria.position.y;
        var az = aviao_obj.fuselagem._estacionaria.position.z;

        // Se o checkpoint foi atravessado, ele é removido da cena e outro checkpoint é adicionado e um som é tocado
        if( ((ax>cx-raio) && (ax<cx+raio)) && ((ay>cy-raio) && (ay<cy+raio)) && ((az>cz-raio) && (az<cz+raio))){
            checkpoint[numeroDoCheck].visible=false;
            scene.remove(checkpoint[numeroDoCheck]);
            scene.add(checkpoint[numeroDoCheck+1]);
            contaCheckpoints();                                     //Chamada para atualizar o textbox
            numeroDoCheck++;
        }
        if(numeroDoCheck>=1){
            //information.textnode.nodeValue = "Checkpoints: " + contadorChecks + " / " + checkpoint.length + " (" + (contadorChecks/checkpoint.length*100).toFixed(2) + "%)"
            information.textnode.nodeValue = "Checkpoints: " + contadorChecks + " / " + checkpoint.length + " (" + (contadorChecks/checkpoint.length*100).toFixed(2) + "%)" + " Tempo atual: " + seconds + "s";
        }
    }
}


var information = new SecondaryBox("");
/**
 * Função que acessa o campo de informação e o atualiza
 * @param {*} text texto a ser exibido na tela
 */
function showInfoOnScreen(text){
    //information.changeMessage(text);
    information.textnode.nodeValue = text;
}
showInfoOnScreen("Atravesse o primeiro checkpoint para começar!")


var contadorChecks=0;
var contabrs = 0;
/**
 * Conta quantos checkpoints foram atravessados. O valor é atualizado toda vez que um check é atravessado
 */
function contaCheckpoints(){
    contadorChecks = 0;
    for (var j=0; j<checkpoint.length; j++){
        if(checkpoint[j].visible == false){  //Se for o primeiro começa a exibir quantos checkpoints foram atravessados
        CheckS.play();
        contadorChecks++;
        }
        /*
        if(contabrs>=0){
            //information.textnode.nodeValue = "Checkpoints: " + contadorChecks + " / " + checkpoint.length + " (" + (contadorChecks/checkpoint.length*100).toFixed(2) + "%)"
            information.textnode.nodeValue = "Checkpoints: " + contadorChecks + " / " + checkpoint.length + " (" + (contadorChecks/checkpoint.length*100).toFixed(2) + "%)" + " Tempo atual: " + seconds;
        }*/
            
    }

    if(contadorChecks == checkpoint.length ){   //Se for o ultimo, exibe o tempo final
        aviao_obj.velocidade_atual = 0;
        aviao_obj.velocidade_atual = 0;

        if(contabrs<1){
            contabrs++;
            
            // Pausa os sons de fundo e do avião e toca o som de percurso finalizado
            airplaneS.stop()
            ambienteS.stop()
            FinishS.play()

            var y = document.getElementById('box');
            information.textnode.nodeValue = "";
            showInfoOnScreen("")
            var textNode = document.createTextNode("");
            y.appendChild(textNode)
            
            information.textnode.nodeValue = "Parabéns por ter concluído o circuito!";
            var br = document.createElement("br");
            y.appendChild(br)
            var br = document.createElement("br");
            y.appendChild(br)

            var textNode = document.createTextNode("Checkpoints: " + contadorChecks + " / " + checkpoint.length + " (" + (contadorChecks/checkpoint.length*100).toFixed(2) +"%)");
            y.appendChild(textNode)
            var br = document.createElement("br");
            y.appendChild(br)

            var textNode = document.createTextNode("Tempo gasto: " + seconds + "s");
            y.appendChild(textNode)
            var br = document.createElement("br");
            y.appendChild(br)
            var br = document.createElement("br");
            y.appendChild(br)

            var textNode = document.createTextNode("Por favor, pressione o botão F5 para reiniciar a simulação!");
            y.appendChild(textNode)
            var br = document.createElement("br");
            y.appendChild(br)
        }
        notifyMe();
        contadorChecks = 0;
    }
}

var seconds = 0;
/**
 * Conta quanto tempo passa do momento que o primeiro checkpoint é atravessado até o ultimo ser atravessado
 * @returns retorna o numero de segundos caso o ultimo checkpoint tenha sido atravessado
 */
function contadorTempo(){
    if(checkpoint[0].visible==false && checkpoint[checkpoint.length-1].visible==true){
        //information.textnode.nodeValue = "Checkpoints: " + contadorChecks + " / " + checkpoint.length + " (" + (contadorChecks/checkpoint.length*100).toFixed(2) + "%)" + " Tempo atual: " + seconds;
        seconds++;
    }
    else
        return seconds;
}
setInterval(contadorTempo, 1000);


/**
 * Mostra uma notificação de desktop ao usuário, informando-o sobre tempo gasto para completar o percurso
 */
function notifyMe() {
    var not = "Parabéns por completar o circuito!" + 
    "\nCheckpoints:" + contadorChecks + 
    "\nTempo gasto: " + seconds + "s" + 
    "\nPor favor, pressione F5 para reiniciar o jogo!";
    
    // Verifica se o browser suporta notificações
    if (!("Notification" in window)) {
        alert("Este browser não suporta notificações de Desktop");
    }

    // Verifica se as notificações ja foram permitidas
    else if (Notification.permission === "granted") {
        // Se estiver ok, vamos criar uma notificação
        var notification = new Notification(not);
    }

    // Senão, vamos pedir permissão ao usuário
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
        // Se o usuário aceitar a permissão, exibiremos a notificação
        if (permission === "granted") {
            var notification = new Notification(not);
        }
        });
    }
}


//-- Trabalho 02 - Parte 2 - Ambiente e aspectos visuais (montanhas e árvores) --
//-------------------------------------------------------------------------------

// Adiciona uma luz hemisphereLight no ambiente
var hemisphereLight = new THREE.HemisphereLight( "white", "white", 0.5 );
hemisphereLight.name = "hemisphereLight"
scene.add( hemisphereLight );
// Luz do sol direcional posicionada no canto superior direito do plano
var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.89 );
directionalLight.name = "dirligh"
directionalLight.position.set(2500, 2500, 2000);
directionalLight.distance = 1000;
directionalLight.penumbra = 0.2;
// Sombras
directionalLight.shadow.camera.left = -2000;
directionalLight.shadow.camera.right = 2000;
directionalLight.shadow.camera.top = 3000;
directionalLight.shadow.camera.bottom = -3000;
// Resolução das sombras
directionalLight.shadow.mapSize.width = 16384;
directionalLight.shadow.mapSize.height = 16384; //8192
// near and far
directionalLight.shadow.camera.near = 100;
directionalLight.shadow.camera.far = 7000;
// Faz a fonte de luz gerar sombras
directionalLight.castShadow = true;
scene.add( directionalLight );

//Tire este comentário para entender como ocorre o posicionamento da luz direcional
//var directionalLightHelper = new THREE.CameraHelper( directionalLight.shadow.camera ); // creates a helper to better visualize the light
//scene.add( directionalLightHelper );


/**
 * Função de criação dos 3 tipos de montanhas - ADAPTADO PARA NÃO GERAR OS PONTOS ALEATORIAMENTE - USANDO THREE.MathUtils.seededRandom()
 * @param {*} base posição
 * @param {*} scale escala do objeto, essa escala aumenta o tamanho do objeto sem afetar o ponto z(altura) onde o objeto foi posicionado
 * @param {*} neve booleano para definir se a montanha tem neve no pico
 * @param {*} raio raio onde serão gerados os pontos da montanha
 * @param {*} n_pontos_base numero de pontos para geração da montanha
 */
 function create_Mountain(base, scale, neve, raio, n_pontos_base) {
    let ponto_aux = []
    let passos = 6
    let x = raio, y = raio, z = 0
    let angle = Math.PI * 2 / n_pontos_base
    let n_pontos_aux = n_pontos_base
    let pontos = []

    for (let i = 0; i < 4; i++) {
          n_pontos_aux = Math.floor(n_pontos_base - (n_pontos_base / (4)) * i)
          for (let j = 0; j < n_pontos_aux; j++) {
                let zaux = (z * THREE.MathUtils.seededRandom() + z * 0.8)
                let xaux = (x * THREE.MathUtils.seededRandom() + x * 0.8)
                let yaux = (y * THREE.MathUtils.seededRandom() + y * 0.8)
                pontos.push(new THREE.Vector3(xaux * Math.cos(angle * j), yaux * Math.sin(angle * j), zaux))
                ponto_aux.push(new THREE.Vector3(xaux * Math.cos(angle * j), yaux * Math.sin(angle * j), zaux))
          }
          x = (1 - THREE.MathUtils.seededRandom() * 0.2) * x
          y = (1 - THREE.MathUtils.seededRandom() * 0.2) * y
          z = (1 + THREE.MathUtils.seededRandom() * 0.2) * z + i
          angle = Math.PI * 2 / n_pontos_aux
    }

    let montanha_base = new THREE.Mesh(new ConvexGeometry(pontos), new THREE.MeshLambertMaterial({ color: '#00f020' }))
    scene.add(montanha_base)
    montanha_base.position.set(base.x, base.y, base.z)
    montanha_base.scale.set(scale, scale, scale)
    montanha_base.castShadow = true;
    montanha_base.receiveShadow = true;

    pontos = []
    for (let i = ponto_aux.length - 1; i > ponto_aux.length - n_pontos_aux - 1 - Math.floor((n_pontos_base / (4)) * 3); i--) {
          pontos.push(ponto_aux[i])
    }

    n_pontos_aux = n_pontos_base

    for (let i = 0; i < passos; i++) {
          n_pontos_aux = Math.floor(n_pontos_base - (n_pontos_base / (passos)) * i)
          for (let j = 0; j < n_pontos_aux; j++) {
                let zaux = (z * THREE.MathUtils.seededRandom() + z * 0.8)
                let xaux = (x * THREE.MathUtils.seededRandom() + x * 0.6)
                let yaux = (y * THREE.MathUtils.seededRandom() + y * 0.6)
                pontos.push(new THREE.Vector3(xaux * Math.cos(angle * j), yaux * Math.sin(angle * j), zaux))
          }
          x = (1 - THREE.MathUtils.seededRandom() * 0.4) * x
          y = (1 - THREE.MathUtils.seededRandom() * 0.4) * y
          z = (1 + THREE.MathUtils.seededRandom() * 0.2) * z
          angle = Math.PI * 2 / n_pontos_aux
    }

    if (neve) { // Nivelar o anterior
          let ponto_neve = []
          let menor_ponto_X = 0
          let maior_ponto_X = 0
          let menor_ponto_Y = 0
          let maior_ponto_Y = 0
          let maior_ponto_Z = 0

          for (let index = Math.floor((n_pontos_base / (passos) * 4)); index >= 0; index--) {
                ponto_neve.push(new THREE.Vector3(pontos[pontos.length - 1 - index].x,
                      pontos[pontos.length - 1 - index].y,
                      pontos[pontos.length - 1 - index].z))
          }

          ponto_neve.sort(function (a, b) { return a.z - b.z })

          maior_ponto_Z = ponto_neve[ponto_neve.length - 1] // maior Z

          ponto_neve.sort(function (a, b) { return b.x - a.x })
          for (let i = 0; i < 4; i++) {
                maior_ponto_X = ponto_neve[i] // maior x
                menor_ponto_X = ponto_neve[ponto_neve.length - 1 - i] // menor x
                maior_ponto_X.z = maior_ponto_Z.z
                menor_ponto_X.z = maior_ponto_Z.z
                pontos.push(maior_ponto_X)
                pontos.push(menor_ponto_X)
          }

          ponto_neve.sort(function (a, b) { return b.y - a.y })
          for (let i = 0; i < 4; i++) {
                maior_ponto_Y = ponto_neve[i] // maior y
                menor_ponto_Y = ponto_neve[ponto_neve.length - 1 - i] // menor y
                maior_ponto_Y.z = maior_ponto_Z.z
                menor_ponto_Y.z = maior_ponto_Z.z
                pontos.push(maior_ponto_Y)
                pontos.push(menor_ponto_Y)
          }

          let figura_2 = new THREE.Mesh(new ConvexGeometry(pontos), new THREE.MeshLambertMaterial({ color: '#804000' }))
          scene.add(figura_2)
          figura_2.position.set(base.x, base.y, base.z)
          figura_2.scale.set(scale, scale, scale)
          figura_2.castShadow = true;
          figura_2.receiveShadow = true;
          
          let n_pontos_neve = ponto_neve.length
          for (let index = 0; index < passos; index++) {
                n_pontos_aux = Math.floor(n_pontos_neve - Math.floor(n_pontos_neve / passos) * index)
                for (let j = 0; j < n_pontos_aux; j++) {
                      let zaux = (z * THREE.MathUtils.seededRandom() + z * 0.6)
                      let xaux = (x * THREE.MathUtils.seededRandom() + x * 0.6)
                      let yaux = (y * THREE.MathUtils.seededRandom() + y * 0.6)
                      ponto_neve.push(new THREE.Vector3(xaux * Math.cos(angle * j), yaux * Math.sin(angle * j), zaux))
                }
                x = (1 - THREE.MathUtils.seededRandom() * 0.3) * x
                y = (1 - THREE.MathUtils.seededRandom() * 0.3) * y
                z = z + 0.5
                angle = Math.PI * 2 / n_pontos_aux
          }

          let figura_neve = new THREE.Mesh(new ConvexGeometry(ponto_neve), new THREE.MeshBasicMaterial({ color: '#f0f0f0' }))
          scene.add(figura_neve)
          figura_neve.position.set(base.x, base.y, base.z)
          figura_neve.scale.set(scale, scale, scale)
          figura_neve.castShadow = true;
          figura_neve.receiveShadow = true;

    } else {
          let figura_2 = new THREE.Mesh(new ConvexGeometry(pontos), new THREE.MeshLambertMaterial({ color: '#804000' }))
          scene.add(figura_2)
          figura_2.position.set(base.x, base.y, base.z)
          figura_2.scale.set(scale, scale, scale)
          figura_2.castShadow = true;
          figura_2.receiveShadow = true;
    }
}
create_Mountain(new THREE.Vector3(-700,1300,1), 16, false, 8, 30)
create_Mountain(new THREE.Vector3(-350,1300,1), 30, true, 7, 40)
create_Mountain(new THREE.Vector3(-100,1500,1), 25, true, 7, 35)



/**
 * Função de criação dos 3 tipos de arvores
 * @param {*} base posição
 * @param {*} tipo valor de 1 a 3 referente a arvore que você quer girar
 * @param {*} rotation valor de rotação utilizado apenas na arvore de tipo 2
 * @param {*} scale escala do objeto, essa escala aumenta o tamanho do objeto sem afetar o ponto z(altura) onde o objeto foi posicionado
 */
function create_arvore(base, tipo, rotation, scale) {
    switch (tipo) {
      case 1:   //1° Tipo de arvore
        let caule_1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 1, 5, 30),  new THREE.MeshLambertMaterial({color: '#804000'}))
        let folhas_1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.5,1) ,  new THREE.MeshLambertMaterial({color: '#408000'}))
        caule_1.scale.set(scale,scale,scale)
        scene.add(caule_1)
        caule_1.add(folhas_1)
        caule_1.position.set(base.x,base.y,base.z + caule_1.geometry.parameters.height/2 * scale)
        caule_1.rotateX(Math.PI/2)
        folhas_1.position.set(0, folhas_1.geometry.parameters.radius,0)
        caule_1.castShadow = true;
        folhas_1.castShadow = true;

        var madeira = textureLoader.load('texturas\\madeira\\madeira1.jpg');
        caule_1.material.map = madeira;
        caule_1.anisotropy = renderer.capabilities.getMaxAnisotropy();
        caule_1.material.map.wrapS = THREE.RepeatWrapping;
        caule_1.material.map.wrapT = THREE.RepeatWrapping;
        caule_1.material.map.minFilter = THREE.LinearFilter;
        caule_1.material.map.magFilter = THREE.LinearFilter;

        var folha = textureLoader.load('texturas\\folhas\\folhas1.jpg');
        folhas_1.material.map = folha;
        folhas_1.anisotropy = renderer.capabilities.getMaxAnisotropy();
        folhas_1.material.map.wrapS = THREE.RepeatWrapping;
        folhas_1.material.map.wrapT = THREE.RepeatWrapping;
        folhas_1.material.map.minFilter = THREE.LinearFilter;
        folhas_1.material.map.magFilter = THREE.LinearFilter;



        break;

      case 2:   //2° Tipo de arvore
        const caule_2_1 = new THREE.Mesh( new THREE.CylinderGeometry(0.6,0.6,3,30,1), new THREE.MeshLambertMaterial( { color : '#804000' } ) );
        caule_2_1.scale.set(scale,scale,scale)
        scene.add(caule_2_1)
        caule_2_1.rotateX(Math.PI/2)
        caule_2_1.position.set(base.x,base.y,base.z + caule_2_1.geometry.parameters.height/2 * scale)
  
        const caule_2_2 = new THREE.Mesh( new THREE.CylinderGeometry(0.35,0.35,2,30,1), new THREE.MeshLambertMaterial( { color : '#804000' } ) );
        caule_2_1.add(caule_2_2)
        caule_2_2.rotateZ(-Math.PI/6)
        caule_2_2.position.set(caule_2_1.geometry.parameters.radiusTop/2 + Math.cos(-Math.PI/6) - caule_2_2.geometry.parameters.radiusTop, caule_2_2.geometry.parameters.height/2 + caule_2_1.geometry.parameters.height/2 + Math.sin(-Math.PI/6), 0)
        
        const caule_2_3 = new THREE.Mesh( new THREE.CylinderGeometry(0.35,0.35,2,30,1), new THREE.MeshLambertMaterial( { color : '#804000' } ) );
        caule_2_1.add(caule_2_3)
        caule_2_3.rotateZ(Math.PI/6)
        caule_2_3.position.set(-caule_2_1.geometry.parameters.radiusTop/2 -Math.cos(Math.PI/6) + caule_2_3.geometry.parameters.radiusTop, caule_2_1.geometry.parameters.height/2 + caule_2_3.geometry.parameters.height/2 + Math.sin(-Math.PI/6), 0)
        
        const folha_2_1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2,1) ,  new THREE.MeshLambertMaterial({color: '#408000'}))
        caule_2_1.add(folha_2_1)
        folha_2_1.position.set(0, caule_2_1.geometry.parameters.height + Math.sin(-Math.PI/6) + folha_2_1.geometry.parameters.radius/2 + caule_2_1.geometry.parameters.height/4, 0)

        const folha_2_2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5,1) ,  new THREE.MeshLambertMaterial({color: '#408000'}))
        caule_2_1.add(folha_2_2)
        folha_2_2.position.set(caule_2_1.geometry.parameters.radiusTop + Math.cos(-Math.PI/6) - caule_2_2.geometry.parameters.radiusTop, caule_2_1.geometry.parameters.height + caule_2_2.geometry.parameters.height/2 + Math.sin(-Math.PI/6), 0)
        
        const folha_2_3 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5,1) ,  new THREE.MeshLambertMaterial({color: '#408000'}))
        caule_2_1.add(folha_2_3)
        folha_2_3.position.set(-caule_2_1.geometry.parameters.radiusTop - Math.cos(-Math.PI/6) + caule_2_2.geometry.parameters.radiusTop, caule_2_1.geometry.parameters.height + caule_2_3.geometry.parameters.height/2 + Math.sin(-Math.PI/6),0)

        caule_2_1.castShadow = true;
        caule_2_2.castShadow = true;
        caule_2_3.castShadow = true;
        folha_2_1.castShadow = true;
        folha_2_2.castShadow = true;
        folha_2_3.castShadow = true;

        var madeira = textureLoader.load('texturas\\madeira\\madeira4.jpg');

        caule_2_1.material.map = madeira;
        caule_2_1.anisotropy = renderer.capabilities.getMaxAnisotropy();
        caule_2_1.material.map.wrapS = THREE.RepeatWrapping;
        caule_2_1.material.map.wrapT = THREE.RepeatWrapping;
        caule_2_1.material.map.minFilter = THREE.LinearFilter;
        caule_2_1.material.map.magFilter = THREE.LinearFilter;

        caule_2_2.material.map = madeira;
        caule_2_2.anisotropy = renderer.capabilities.getMaxAnisotropy();
        caule_2_2.material.map.wrapS = THREE.RepeatWrapping;
        caule_2_2.material.map.wrapT = THREE.RepeatWrapping;
        caule_2_2.material.map.minFilter = THREE.LinearFilter;
        caule_2_2.material.map.magFilter = THREE.LinearFilter;

        caule_2_3.material.map = madeira;
        caule_2_3.anisotropy = renderer.capabilities.getMaxAnisotropy();
        caule_2_3.material.map.wrapS = THREE.RepeatWrapping;
        caule_2_3.material.map.wrapT = THREE.RepeatWrapping;
        caule_2_3.material.map.minFilter = THREE.LinearFilter;
        caule_2_3.material.map.magFilter = THREE.LinearFilter;
        
        var folha = textureLoader.load('texturas\\folhas\\folhas2.jpg');
        
        folha_2_1.material.map = folha;
        folha_2_1.anisotropy = renderer.capabilities.getMaxAnisotropy();
        folha_2_1.material.map.wrapS = THREE.RepeatWrapping;
        folha_2_1.material.map.wrapT = THREE.RepeatWrapping;
        folha_2_1.material.map.minFilter = THREE.LinearFilter;
        folha_2_1.material.map.magFilter = THREE.LinearFilter;

        folha_2_2.material.map = folha;
        folha_2_2.anisotropy = renderer.capabilities.getMaxAnisotropy();
        folha_2_2.material.map.wrapS = THREE.RepeatWrapping;
        folha_2_2.material.map.wrapT = THREE.RepeatWrapping;
        folha_2_2.material.map.minFilter = THREE.LinearFilter;
        folha_2_2.material.map.magFilter = THREE.LinearFilter;

        folha_2_3.material.map = folha;
        folha_2_3.anisotropy = renderer.capabilities.getMaxAnisotropy();
        folha_2_3.material.map.wrapS = THREE.RepeatWrapping;
        folha_2_3.material.map.wrapT = THREE.RepeatWrapping;
        folha_2_3.material.map.minFilter = THREE.LinearFilter;
        folha_2_3.material.map.magFilter = THREE.LinearFilter;

        
        caule_2_1.rotateY(rotation)
        break;
  
      case 3:   //3° Tipo de arvore
        const caule_3 = new THREE.Mesh( new THREE.CylinderGeometry(0.4,0.1,6,30,1), new THREE.MeshLambertMaterial( { color : '#804000' } ) );
        caule_3.scale.set(scale,scale,scale)
        scene.add(caule_3)
        caule_3.rotateX(-Math.PI/2)
        caule_3.position.set(base.x,base.y,base.z + caule_3.geometry.parameters.height/2 * scale)
  
        const folha_3_1 = new THREE.Mesh( new THREE.CylinderGeometry(2,0,5,30,1), new THREE.MeshLambertMaterial( { color : '#408000' } ) );
        caule_3.add(folha_3_1)
        folha_3_1.position.set(0,0,0)
        
        const folha_3_2 = new THREE.Mesh( new THREE.CylinderGeometry(0.6,0,1,30,1), new THREE.MeshLambertMaterial( { color : '#408000' } ) );
        caule_3.add(folha_3_2)
        folha_3_2.position.set(0, -caule_3.geometry.parameters.height/2, 0)
        
        caule_3.castShadow = true;
        folha_3_1.castShadow = true;
        folha_3_2.castShadow = true;

        var madeira = textureLoader.load('texturas\\madeira\\madeira3.jpg');
        
        caule_3.material.map = madeira;
        caule_3.anisotropy = renderer.capabilities.getMaxAnisotropy();
        caule_3.material.map.wrapS = THREE.RepeatWrapping;
        caule_3.material.map.wrapT = THREE.RepeatWrapping;
        caule_3.material.map.minFilter = THREE.LinearFilter;
        caule_3.material.map.magFilter = THREE.LinearFilter;

        var folha = textureLoader.load('texturas\\folhas\\folhas4.jpg');
        
        folha_3_1.material.map = folha;
        folha_3_1.anisotropy = renderer.capabilities.getMaxAnisotropy();
        folha_3_1.material.map.wrapS = THREE.RepeatWrapping;
        folha_3_1.material.map.wrapT = THREE.RepeatWrapping;
        folha_3_1.material.map.minFilter = THREE.LinearFilter;
        folha_3_1.material.map.magFilter = THREE.LinearFilter;

        folha_3_2.material.map = folha;
        folha_3_2.anisotropy = renderer.capabilities.getMaxAnisotropy();
        folha_3_2.material.map.wrapS = THREE.RepeatWrapping;
        folha_3_2.material.map.wrapT = THREE.RepeatWrapping;
        folha_3_2.material.map.minFilter = THREE.LinearFilter;
        folha_3_2.material.map.magFilter = THREE.LinearFilter;



        break;

      default:
        console.error("ERRO: " + tipo + " incorrespondente")
        break;
    }
  }


/**
 * Função que posiciona as arvores randomicamente - EXCLUINDO A AREA DA MONTANHA E DA DECOLAGEM E POUSO DO AVIÃO
 * @param {*} num_arvores numero de arvores que vc quer posicionar na cena
 */
function randomTreePosition(num_arvores){
    for(var i=0; i<num_arvores ;i++){
        var regiao = Math.round(getRandom(0,4.4));
        switch (regiao){
            case 0:
            create_arvore(new THREE.Vector3(getRandom(-2400, -60), getRandom(-2400, 800), 0), 1, 0, getRandom(2,5)) //2 - 5
            create_arvore(new THREE.Vector3(getRandom(-2400, -60), getRandom(-2400, 800), 0), 2, degreesToRadians(getRandom(0,90)), getRandom(5,10)) //rotation entre 0 e 90 e 4 até 6
            create_arvore(new THREE.Vector3(getRandom(-2400, -60), getRandom(-2400, 800), 0), 3, 0, getRandom(8,10))
            break;

            case 1:
            create_arvore(new THREE.Vector3(getRandom(60, 2400), getRandom(-2400, 800), 0), 1, 0, getRandom(2,5)) //2 - 5
            create_arvore(new THREE.Vector3(getRandom(60, 2400), getRandom(-2400, 800), 0), 2, degreesToRadians(getRandom(0,90)), getRandom(5,10)) //rotation entre 0 e 90 e 4 até 6
            create_arvore(new THREE.Vector3(getRandom(60, 2400), getRandom(-2400, 800), 0), 3, 0, getRandom(8,10))
            break;

            case 2:
            create_arvore(new THREE.Vector3(getRandom(300,2400), getRandom(810,2400), 0), 1, 0, getRandom(2,5)) //2 - 5
            create_arvore(new THREE.Vector3(getRandom(300,2400), getRandom(810,2400), 0), 2, degreesToRadians(getRandom(0,90)), getRandom(5,10)) //rotation entre 0 e 90 e 4 até 6
            create_arvore(new THREE.Vector3(getRandom(300,2400), getRandom(810,2400), 0), 3, 0, getRandom(8,10))
            break;

            case 3:
            create_arvore(new THREE.Vector3(getRandom(-2400,300), getRandom(1800,2400), 0), 1, 0, getRandom(2,5)) //2 - 5
            create_arvore(new THREE.Vector3(getRandom(-2400,300), getRandom(1800,2400), 0), 2, degreesToRadians(getRandom(0,90)), getRandom(5,10)) //rotation entre 0 e 90 e 4 até 6
            create_arvore(new THREE.Vector3(getRandom(-2400,300), getRandom(1800,2400), 0), 3, 0, getRandom(8,10))
            break;

            case 4:
            create_arvore(new THREE.Vector3(getRandom(-2400, -910), getRandom(800, 1800), 0), 1, 0, getRandom(2,5)) //2 - 5
            create_arvore(new THREE.Vector3(getRandom(-2400, -910), getRandom(800, 1800), 0), 2, degreesToRadians(getRandom(0,90)), getRandom(5,10)) //rotation entre 0 e 90 e 4 até 6
            create_arvore(new THREE.Vector3(getRandom(-2400, -910), getRandom(800, 1800), 0), 3, 0, getRandom(8,10))
            break;
        }
    }

}
randomTreePosition(25);
//create_arvore(new THREE.Vector3(1200, -1000, 0), 2, degreesToRadians(getRandom(0,90)), 120) //rotation entre 0 e 90 e 4 até 6

//-------------------- Trabalho 02 - Parte 3 - Modo cockpit --------------------
//------------------------------------------------------------------------------

/**
 * Função Auxiliar para entrar no modo cockpit
 */
function entraCockpit(){
    camera.position.set(0, -3.5, 5.65)
    camera.rotation.x = degreesToRadians(95);
}

/**
 * Função Auxiliar para sair do modo cockpit
 */
function saiCockpit(){
    // Reposiciona a camera
    camera.position.set(0,-80,20)
    camera.rotation.set(Math.PI/2,0,0)
    camera.up.set(0,1,0)
}


//============================================= FLIGHT SCHOOL - Trabalho 03 =============================================
//=======================================================================================================================


//----------------------- Trabalho 03 - Parte 2 - Cidade -----------------------
//------------------------------------------------------------------------------

var objeto = new THREE.Object3D();
function loadOBJFile(modelPath, modelName, position, desiredScale, angle1, angle2=0, angle3=0, visibility, texture=false, materialPath="")
{
    var currentModel = modelName;
    var manager = new THREE.LoadingManager( );

    var mtlLoader = new MTLLoader( manager );
    mtlLoader.setPath( modelPath );
    mtlLoader.load( modelName + '.mtl', function ( materials ) {
        materials.preload();
        var objLoader = new OBJLoader( manager );
        objLoader.setMaterials(materials);
        objLoader.setPath(modelPath);

        objLoader.load( modelName + ".obj", function ( obj ) {
            obj.visible = visibility;
            obj.name = modelName;

            // Set 'castShadow' property for each children of the group
            obj.traverse( function (child) { child.castShadow = true;});
            obj.traverse( function( node ){ if( node.material ) node.material.side = THREE.DoubleSide; });

            if(texture)
                obj.traverse( function( node ){ if( node.material ) node.material.map = materialPath ;});

            obj.position.set(position.x, position.y, position.z)
            obj.scale.set(desiredScale, desiredScale, desiredScale)
            obj.rotateX(degreesToRadians(angle1));
            obj.rotateY(degreesToRadians(angle2));
            obj.rotateZ(degreesToRadians(angle3));

            scene.add ( obj );
            objeto = obj;
        });
    });
}




var OBJposition = new THREE.Vector3(50, 20, 0)
//loadOBJFile("objetos\\Estatua\\", "Statue", OBJposition, 0.1, 0, 0, 0, false)

var houseTexture = textureLoader.load('objetos\\casas\\20960_Front_Gable_House_texture.jpg');
loadOBJFile("objetos\\Casas\\", "20960_Front_Gable_House_v1_NEW", OBJposition, 10, 0, 0, 0, false, true, houseTexture)






var asfaltoGeometria = new THREE.PlaneGeometry( 50, 500 );
var asfaltoMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} ); //0031e7
var rua1 = new THREE.Mesh(asfaltoGeometria, asfaltoMaterial);
rua1.position.z = 0.1;
scene.add(rua1);

//-- Use TextureLoader to load texture files
var ruaTexture = textureLoader.load('texturas\\estrada\\estrada2.jpg');

rua1.material.map = ruaTexture;
rua1.material.map.repeat.set(1, 5);
rua1.anisotropy = renderer.capabilities.getMaxAnisotropy();
rua1.material.map.wrapS = THREE.RepeatWrapping;
rua1.material.map.wrapT = THREE.RepeatWrapping;


var rua2 = rua1.clone();
rua2.position.x = 100;
scene.add(rua2)


var cruzamentoGeometria = new THREE.PlaneGeometry( 50, 50 );
var cruzamentoMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide} ); //0031e7
var cruzamento1 = new THREE.Mesh(cruzamentoGeometria, cruzamentoMaterial);
cruzamento1.position.z = 0.5;
scene.add(cruzamento1);

//-- Use TextureLoader to load texture files
var escruzilhada1Texture = textureLoader.load('texturas\\estrada\\encruzilhada1.jpg');
cruzamento1.material.map = escruzilhada1Texture ;
cruzamento1.material.map.wrapS = THREE.RepeatWrapping;
cruzamento1.material.map.wrapT = THREE.RepeatWrapping;
cruzamento1.material.map.minFilter = THREE.LinearFilter;
cruzamento1.material.map.magFilter = THREE.LinearFilter;


//------------------------ Trabalho 03 - Parte 3 - Periferia ------------------------
//-----------------------------------------------------------------------------------



var pracaGeometria1 = new THREE.CircleGeometry( 200, 50 );
var pracaGeometria2 = new THREE.CircleGeometry( 190, 50 );
var pracaMaterial1 = new THREE.MeshBasicMaterial( {color: 0xffffff} );
var pracaMaterial2 = new THREE.MeshBasicMaterial( {color: 0xffffff} );
var praca1 = new THREE.Mesh(pracaGeometria1, pracaMaterial1);
var praca2 = new THREE.Mesh(pracaGeometria2, pracaMaterial2);

praca1.position.x = -250;
praca2.position.x = praca1.position.x;
praca1.position.z = 0.1;
praca2.position.z = praca1.position.z+0.2;
scene.add(praca1);
scene.add(praca2);

// Carrega o gazebo no centro da praça
var OBJposition = new THREE.Vector3(praca1.position.x, praca1.position.y, praca1.position.z+0.4)
loadOBJFile("objetos\\Gazebo\\", "gazebo", OBJposition, 15, 90, -24, 0, true)

//-- Use TextureLoader to load texture files
var pracaTexture1 = textureLoader.load('texturas\\chao\\chao7.jpg');
var pracaTexture2 = textureLoader.load('texturas\\chao\\chao4.jpg');

praca1.material.map = pracaTexture1;
praca1.material.map.repeat.set(10, 10);
praca1.anisotropy = renderer.capabilities.getMaxAnisotropy();
praca1.material.map.wrapS = THREE.RepeatWrapping;
praca1.material.map.wrapT = THREE.RepeatWrapping;


praca2.material.map = pracaTexture2;
praca2.material.map.repeat.set(10, 10);
praca2.anisotropy = renderer.capabilities.getMaxAnisotropy();
praca2.material.map.wrapS = THREE.RepeatWrapping;
praca2.material.map.wrapT = THREE.RepeatWrapping;

var caminhogeometria1 = new THREE.BoxGeometry( 10, praca2.geometry.parameters.radius*2,1 );
var caminhoMaterial1 = new THREE.MeshBasicMaterial( {color: 0xffffff} );
var caminho1 = new THREE.Mesh(caminhogeometria1, caminhoMaterial1);
caminho1.position.copy(praca2.position);
caminho1.position.z = caminho1.position.z+0.1
caminho1.rotation.z=Math.PI/2
scene.add(caminho1);

var caminhoTexture = textureLoader.load('texturas\\chao\\chao7.jpg');

caminho1.material.map = caminhoTexture;
caminho1.material.map.repeat.set(0.8, 8);
caminho1.anisotropy = renderer.capabilities.getMaxAnisotropy();
caminho1.material.map.wrapS = THREE.RepeatWrapping;
caminho1.material.map.wrapT = THREE.RepeatWrapping;


create_arvore(new THREE.Vector3(praca1.position.x + getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y + getRandom(30, praca2.geometry.parameters.radius-35), 0), 1, 0, 3) //2 - 5
create_arvore(new THREE.Vector3(praca1.position.x + getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y + getRandom(30, praca2.geometry.parameters.radius-35), 0), 2, 0, 2) //rotation entre 0 e 90 e 4 até 6
create_arvore(new THREE.Vector3(praca1.position.x + getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y + getRandom(30, praca2.geometry.parameters.radius-35), 0), 3, 0, 3)

create_arvore(new THREE.Vector3(praca1.position.x + getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y + getRandom(30, praca2.geometry.parameters.radius-35), 0), 1, 0, 4) //2 - 5
create_arvore(new THREE.Vector3(praca1.position.x + getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y + getRandom(30, praca2.geometry.parameters.radius-35), 0), 2, 0, 5) //rotation entre 0 e 90 e 4 até 6
create_arvore(new THREE.Vector3(praca1.position.x + getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y + getRandom(30, praca2.geometry.parameters.radius-35), 0), 3, 0, 4)

create_arvore(new THREE.Vector3(praca1.position.x + getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y - getRandom(30, praca2.geometry.parameters.radius-35), 0), 1, 0, 3) //2 - 5
create_arvore(new THREE.Vector3(praca1.position.x + getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y - getRandom(30, praca2.geometry.parameters.radius-35), 0), 2, 0, 2) //rotation entre 0 e 90 e 4 até 6
create_arvore(new THREE.Vector3(praca1.position.x + getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y - getRandom(30, praca2.geometry.parameters.radius-35), 0), 3, 0, 3)

create_arvore(new THREE.Vector3(praca1.position.x + getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y - getRandom(30, praca2.geometry.parameters.radius-35), 0), 1, 0, 4) //2 - 5
create_arvore(new THREE.Vector3(praca1.position.x + getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y - getRandom(30, praca2.geometry.parameters.radius-35), 0), 2, 0, 5) //rotation entre 0 e 90 e 4 até 6
create_arvore(new THREE.Vector3(praca1.position.x + getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y - getRandom(30, praca2.geometry.parameters.radius-35), 0), 3, 0, 4)

create_arvore(new THREE.Vector3(praca1.position.x - getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y - getRandom(30, praca2.geometry.parameters.radius-35), 0), 1, 0, 3) //2 - 5
create_arvore(new THREE.Vector3(praca1.position.x - getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y - getRandom(30, praca2.geometry.parameters.radius-35), 0), 2, 0, 2) //rotation entre 0 e 90 e 4 até 6
create_arvore(new THREE.Vector3(praca1.position.x - getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y - getRandom(30, praca2.geometry.parameters.radius-35), 0), 3, 0, 3)

create_arvore(new THREE.Vector3(praca1.position.x - getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y - getRandom(30, praca2.geometry.parameters.radius-35), 0), 1, 0, 4) //2 - 5
create_arvore(new THREE.Vector3(praca1.position.x - getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y - getRandom(30, praca2.geometry.parameters.radius-35), 0), 2, 0, 5) //rotation entre 0 e 90 e 4 até 6
create_arvore(new THREE.Vector3(praca1.position.x - getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y - getRandom(30, praca2.geometry.parameters.radius-35), 0), 3, 0, 4)

create_arvore(new THREE.Vector3(praca1.position.x - getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y + getRandom(30, praca2.geometry.parameters.radius-35), 0), 1, 0, 3) //2 - 5
create_arvore(new THREE.Vector3(praca1.position.x - getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y + getRandom(30, praca2.geometry.parameters.radius-35), 0), 2, 0, 2) //rotation entre 0 e 90 e 4 até 6
create_arvore(new THREE.Vector3(praca1.position.x - getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y + getRandom(30, praca2.geometry.parameters.radius-35), 0), 3, 0, 3)

create_arvore(new THREE.Vector3(praca1.position.x - getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y + getRandom(30, praca2.geometry.parameters.radius-35), 0), 1, 0, 4) //2 - 5
create_arvore(new THREE.Vector3(praca1.position.x - getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y + getRandom(30, praca2.geometry.parameters.radius-35), 0), 2, 0, 5) //rotation entre 0 e 90 e 4 até 6
create_arvore(new THREE.Vector3(praca1.position.x - getRandom(30, praca2.geometry.parameters.radius-35), praca1.position.y + getRandom(30, praca2.geometry.parameters.radius-35), 0), 3, 0, 4)





















//----------------------- Trabalho 03 - Parte 4 - Skybox -----------------------
//------------------------------------------------------------------------------

//Referência: https://codinhood.com/post/create-skybox-with-threejs
const ft = new THREE.TextureLoader().load("texturas\\clouds\\clouds_north.bmp");
const bk = new THREE.TextureLoader().load("texturas\\clouds\\clouds_south.bmp");
const up = new THREE.TextureLoader().load("texturas\\clouds\\clouds_up.bmp");
const dn = new THREE.TextureLoader().load("texturas\\clouds\\clouds_down.bmp");
const rt = new THREE.TextureLoader().load("texturas\\clouds\\clouds_west.bmp");
const lf = new THREE.TextureLoader().load("texturas\\clouds\\clouds_east.bmp");

function createPathStrings(filename) {
    const basePath = "texturas\\clouds\\";
    const baseFilename = basePath + filename;
    const fileType = ".bmp";
    const sides = ["north", "south", "up", "down", "west", "east"];
    const pathStings = sides.map(side => {
      return baseFilename + "_" + side + fileType;
    });
    return pathStings;
}


function createMaterialArray(filename) {
    const skyboxImagepaths = createPathStrings(filename);
    const materialArray = skyboxImagepaths.map(image => {
        let texture = new THREE.TextureLoader().load(image);
        return new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });// side: THREE.BackSide
    });
    return materialArray;
}

const materialArray = createMaterialArray("clouds");
var skyboxGeo = new THREE.BoxGeometry(9999, 9999, 10000);
var skybox = new THREE.Mesh(skyboxGeo, materialArray);
skybox.rotation.x = Math.PI/2
skybox.rotation.y = Math.PI/2
scene.add(skybox);

skybox.anisotropy = renderer.capabilities.getMaxAnisotropy();
skybox.material.map.wrapS = THREE.RepeatWrapping;
skybox.material.map.wrapT = THREE.RepeatWrapping;
skybox.material.map.minFilter = THREE.LinearFilter;
skybox.material.map.magFilter = THREE.LinearFilter;







//------------------- Trabalho 03 - Parte 5 - Elementos Adicionais -------------------
//------------------------------------------------------------------------------------


//Tela de carregamento

/*
const loadingManager = new THREE.LoadingManager( () => {
	
    const loadingScreen = document.getElementById( 'loading-screen' );
    loadingScreen.classList.add( 'fade-out' );
    
    // optional: remove loader from DOM via event listener
    loadingScreen.addEventListener( 'transitionend', onTransitionEnd );
    
} );

*/
/*
const manager = new THREE.LoadingManager();
manager.onStart = function ( url, itemsLoaded, itemsTotal ) {

	console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

};

manager.onLoad = function ( ) {

	console.log( 'Loading complete!');

};


manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {

	console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

};

manager.onError = function ( url ) {

	console.log( 'There was an error loading ' + url );

};
*/
/*
const loader = new THREE.OBJLoader( manager );
loader.load( 'file.obj', function ( object ) {

	//

} );
*/
/*
var sphereMaterial = new THREE.MeshBasicMaterial();

var onProgress = function ( xhr ) {
  if ( xhr.lengthComputable ) {
    var percentComplete = xhr.loaded / xhr.total * 100;
    console.log( Math.round(percentComplete, 2) + '% downloaded' );
  }
};

var loader = new THREE.TextureLoader();
var texture = loader.load("___4MB_IMAGE.JPG___", undefined, onProgress);
sphereMaterial.map = texture;
*/

/*
//initialize the manager to handle all loaded events (currently just works for OBJ and image files)
var manager = new THREE.LoadingManager();

manager.onProgress = function (item, loaded, total) {
    console.log(item, loaded, total);
};
manager.onLoad = function () {
    console.log('all items loaded');
};
manager.onError = function () {
    console.log('there has been an error');
};
*/
/*FUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONALFUNCIONAL
THREE.DefaultLoadingManager.onStart = function ( url, itemsLoaded, itemsTotal ) {

	console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

};

THREE.DefaultLoadingManager.onLoad = function ( ) {

	console.log( 'Loading Complete!');

};


THREE.DefaultLoadingManager.onProgress = function ( url, itemsLoaded, itemsTotal ) {

	console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );

};

THREE.DefaultLoadingManager.onError = function ( url ) {

	console.log( 'There was an error loading ' + url );

};
*/
/*
// Iniciando o loading manager
const manager = new THREE.LoadingManager();

let curLoaded;
let totalLoaded;

const loadingText = document.getElementById("loading-progress");
const loadingBar = document.getElementById("progress-bar");
const loadingScreen = document.getElementById("loading-screen");

const updateLoading = () => {
  loadingText.innerText = `${curLoaded}/${totalLoaded}`;
  loadingBar.style.width = `${Math.floor((curLoaded / totalLoaded) * 100)}%`;
};

manager.onStart = (url, itemsLoaded, itemsTotal) => {
  curLoaded = itemsLoaded;
  totalLoaded = itemsTotal;
  updateLoading();
};

manager.onProgress = (url, itemsLoaded, itemsTotal) => {
  curLoaded = itemsLoaded;
  totalLoaded = itemsTotal;
  updateLoading();
};
*/


const audioListener = new THREE.AudioListener();
camera.add(audioListener);

const audioLoader = new THREE.AudioLoader();

function ambientSound(audioListener, audioLoader){
    const audio = new THREE.Audio(audioListener);
  
    audioLoader.load("audios\\Música Ambiente - Tim Maia - Ela Partiu.mp3", function (buffer) {
      audio.setBuffer(buffer);
      audio.setLoop(true)
      audio.setVolume(0.1);
    });
    return audio;
};

function airplaneSound(audioListener, audioLoader){
    const audio = new THREE.Audio(audioListener);
  
    audioLoader.load("audios\\Som do aviao.mp3", function (buffer) {
      audio.setBuffer(buffer);
      audio.setLoop(true)
      audio.setVolume(0.3);
    });
    return audio;
};

function CheckSound(audioListener, audioLoader){
    const audio = new THREE.Audio(audioListener);
  
    audioLoader.load("audios\\Checkpoints.mp3", function (buffer) {
      audio.setBuffer(buffer);
      audio.setVolume(1);
    });
    return audio;
};

function FinishSound(audioListener, audioLoader){
    const audio = new THREE.Audio(audioListener);
  
    audioLoader.load("audios\\Finalizar Percurso.mp3", function (buffer) {
      audio.setBuffer(buffer);
      audio.setVolume(1);
    });
    return audio;
};


var ambienteS = ambientSound(audioListener, audioLoader);
var airplaneS = airplaneSound(audioListener, audioLoader);
var CheckS = CheckSound(audioListener, audioLoader);
var FinishS = FinishSound(audioListener, audioLoader);









// Enable Shadows in the Renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
buildInterface();
render();

// Função de renderização do Three.js
function render() {
    stats.update(); // Update FPS
    requestAnimationFrame(render);
    renderer.setClearColor(0x0193df);
    renderer.render(scene, camera); // Render scene
    keyboardUpdate();
    if(isSimulacao){
        trackballControls.update();
        //plano.visible = false;
        axesHelper.visible = true;
        //controlaVisibilidade(false);
    }else{
        plano.visible = true;
        axesHelper.visible = false;
        movimento();

        //Flight School - Trabalho 2
        verificaCheckpoint();
    }
}
