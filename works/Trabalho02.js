import * as THREE from "../build/three.module.js";
import Stats from "../build/jsm/libs/stats.module.js";
import {TrackballControls} from "../build/jsm/controls/TrackballControls.js";
import KeyboardState from "../libs/util/KeyboardState.js";
import {ConvexGeometry} from '../build/jsm/geometries/ConvexGeometry.js'; // importante
import {
    initRenderer,
    initDefaultBasicLight,
    InfoBox,
    createGroundPlane,
    createGroundPlaneWired,
    onWindowResize,
    degreesToRadians,
    radiansToDegrees
} from "../libs/util/util.js";

var stats = new Stats(); // To show FPS information
var scene = new THREE.Scene(); // Create main scene
var renderer = initRenderer(); // View function in util/utils
//const light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
//scene.add( light );
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000);


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


//=================================================== FLIGHT SIMULATOR ===================================================
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
    aceleracao: 0.01,
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
    asa_cima.position.set(0, 1, cabine_geometria.parameters.radiusTop + 1.5);
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
    var protecao_geometria = new THREE.TorusGeometry(cabine_geometria.parameters.radiusBottom, cabine_geometria.parameters.radiusBottom / 5, 30, 6);
    var protecao = new THREE.Mesh(protecao_geometria, metal_cinza);
    protecao.castShadow = true;
    cabine.add(protecao);
    protecao.rotateX(Math.PI / 2);
    protecao.position.set(0, - cabine_geometria.parameters.height / 2, 0);

    var cone_motor_geometria = new THREE.ConeGeometry(cabine_geometria.parameters.radiusBottom, 2);
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
    leme_cima_meio.position.set(- leme_meio_geometria.parameters.height, - flap_leme_geometria.parameters.width * 0.3, 0);
    leme_cima_meio.rotateZ(Math.PI / 2);

    var leme_cima_frente = new THREE.Mesh(leme_frente_geometria, casco);
    leme_cima.add(leme_cima_frente);
    leme_cima_frente.position.set(leme_meio_geometria.parameters.height / 2, 0, 0);
    leme_cima_frente.rotateZ(Math.PI / 2);
    // # fuselagem.fuselagem._movel = { leme_meio : flap_leme_cima}

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

/*
// create the ground plane
var planeGeometry = new THREE.PlaneGeometry(5000, 5000);
planeGeometry.translate(0.0, 0.0, -0.02); // To avoid conflict with the axeshelper
var planeMaterial = new THREE.MeshBasicMaterial({
    color: "#00f020",
    side: THREE.DoubleSide,
});
var plano = new THREE.Mesh(planeGeometry, planeMaterial);
// add the plane to the scene
scene.add(plano);
plano.receiveShadow = true;
*/

//Funciona as sombras
var plano = createGroundPlane(5000, 5000, 40, 40); // width, height, resolutionW, resolutionH
plano.material.color.r = 0
plano.material.color.g = 199/255
plano.material.color.b = 27/255

scene.add(plano);
plano.receiveShadow = true;


/*
// Criando o plano e adicionando na cena
var plano = createGroundPlaneWired(5000, 5000, 20, 20); // width, height
plano.rotation.set(0, 0, 0);
scene.add(plano);
*/
// Cria uma variável para cuidar da mudança de tipo de câmera
var keyboard = new KeyboardState();


//================================== Configurações de camera ==================================
// Enable mouse rotation, pan, zoom etc.
var trackballControls = new TrackballControls(camera, renderer.domElement);
trackballControls.noPan = true
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
    //var controls = new InfoBox();
    controls.add("Simulador de voo - Controles");
    controls.addParagraph(); // Setas:https://textkool.com/pt/symbols/arrows-symbols
    controls.add("# Q  /  A - Acelera/Freia");
    controls.add("# ↥  /  ↧ - Sobe/Desce o bico do avião");
    controls.add("# ↤ /  ↦ - Vira para Esquerda/Direita");
    controls.add("#  SPACE  - Camera em Inspeção/Simulador");

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

function entraCockpit(){
    //if(!pressionadoSpace){
    // Salva os valores de posição vindos da simulação
    aviao_auxiliar.position.x = aviao_obj.fuselagem._estacionaria.position.x;
    aviao_auxiliar.position.y = aviao_obj.fuselagem._estacionaria.position.y;
    aviao_auxiliar.position.z = aviao_obj.fuselagem._estacionaria.position.z;
    
    camera_auxiliar.position.x = camera.position.x;
    camera_auxiliar.position.y = camera.position.y;
    camera_auxiliar.position.z = camera.position.z;
    
    cameraHolder_auxiliar.position.x = cameraHolder.position.x;
    cameraHolder_auxiliar.position.y = cameraHolder.position.y;
    cameraHolder_auxiliar.position.z = cameraHolder.position.z;

    // Salva os valores de rotação vindos da simulação
    aviao_auxiliar.rotation.x = aviao_obj.fuselagem._estacionaria.rotation.x;
    aviao_auxiliar.rotation.y = aviao_obj.fuselagem._estacionaria.rotation.y;
    aviao_auxiliar.rotation.z = aviao_obj.fuselagem._estacionaria.rotation.z;
    
    camera_auxiliar.rotation.x = camera.rotation.x;
    camera_auxiliar.rotation.y = camera.rotation.y;
    camera_auxiliar.rotation.z = camera.rotation.z;
    
    cameraHolder_auxiliar.rotation.x = cameraHolder.rotation.x;
    cameraHolder_auxiliar.rotation.y = cameraHolder.rotation.y;
    cameraHolder_auxiliar.rotation.z = cameraHolder.rotation.z;

    // Salva os valores de up vindos da camera na simulação
    camera_auxiliar.up.x = camera.up.x
    camera_auxiliar.up.y = camera.up.y
    camera_auxiliar.up.z = camera.up.z
    

    cameraHolder.position.set(0,0,0)
    //cameraHolder.rotation.set(0,0,0)

    camera.position.set(0, -3.5, 5.6)
    camera.rotation.x = degreesToRadians(87);
    //camera.up.set(0,1,0)
}

function saiCockpit(){
    
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

//============================= Configurações de Movimentação =============================
// Controle de botões pressionados
var pressionadoUP = false;
var pressionadoDown = false;
var pressionadoLeft = false;
var pressionadoRight = false;
var pressionadoC = false;
var pressionadoSpace = false;

// Função controladora da camera a partir do teclado
function keyboardUpdate() {
    keyboard.update();

    // Muda o tipo de câmera
    if(!pressionadoC){
        if (keyboard.down("space")) {
            pressionadoSpace = !pressionadoSpace;
            mudaCamera();
        }
    }

    // Tecla de Debug para testes
    if (keyboard.up("D")) {
    }

    if (keyboard.down("enter")) { // Mostra o caminho                                           //FLIGHT SCHOOL - T2
        curveObject.visible = !curveObject.visible;
    }

    if(!isSimulacao){
        if (keyboard.pressed("Q")) { // Aceleração progressiva
            if (aviao_obj.velocidade_atual < aviao_obj.velocidade_Max) {
                aviao_obj.velocidade_atual += aviao_obj.aceleracao;
            }
        }

        if (keyboard.down("C")) { //Modo Cockpit                                             //FLIGHT SCHOOL - T2
            pressionadoC = !pressionadoC;
            if(pressionadoC){
                entraCockpit();
            }
            else{
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





//==================================================== FLIGHT SCHOOL ====================================================
//=======================================================================================================================

//Função Auxiliar para conseguir números randomicos em determinado intervalo
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
  }


var pontosDaLinha = 
[new THREE.Vector3( 0, 0, 0 ),                              //Origin
new THREE.Vector3( 0, getRandom(50,100), -800 ),            //1
new THREE.Vector3( 800, getRandom(60,150), -1600 ),         //2
new THREE.Vector3( -400, getRandom(70,200), -2400 ),        //3
new THREE.Vector3( -800, getRandom(90,250), -1600 ),        //4
new THREE.Vector3( -1000, getRandom(90,320), -1000 ),       //5
new THREE.Vector3( -800, getRandom(150,250), -800 ),        //6
new THREE.Vector3( 0, getRandom(200,320), 800),             //7
new THREE.Vector3( 800, getRandom(70,220), 0),              //8
new THREE.Vector3( 1600, getRandom(50,320), 800),           //9
new THREE.Vector3( 2400, getRandom(40,220), 1600),          //10
new THREE.Vector3( 800, getRandom(50,220), 1600),           //11
new THREE.Vector3( 0, getRandom(50,120), 1600),             //12
new THREE.Vector3( 0, getRandom(40,150), 500),              //13
new THREE.Vector3( 0, 0, 0 )]                               //end


//Cria uma curva a partir dos pontos definidos anteriormente
const curve = new THREE.CatmullRomCurve3(pontosDaLinha);
const curvepoints = curve.getPoints( 300 );
const curvegeometry = new THREE.BufferGeometry().setFromPoints( curvepoints);
const curvematerial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
const curveObject = new THREE.Line( curvegeometry, curvematerial );
curveObject.rotateX(Math.PI/2)
curveObject.visible = true;
scene.add(curveObject);


const checkpointgeometry = new THREE.TorusGeometry( 20, 2, 3, 100 );
const checkpointmaterial = new THREE.MeshBasicMaterial( { color: 0x8a6521, opacity: 0.8 , transparent: true } ); //0xfec2b8
var checkpoint = [];

function defineCheckpoints(){
    for (var i=1, j=0; i<pontosDaLinha.length - 1; i++, j++){
        checkpoint[j] = new THREE.Mesh( checkpointgeometry, checkpointmaterial );
        checkpoint[j].position.x = pontosDaLinha[i].x;
        checkpoint[j].position.y = -pontosDaLinha[i].z;
        checkpoint[j].position.z = pontosDaLinha[i].y;
        checkpoint[j].lookAt(checkpoint[j].position);
        checkpoint[j].rotateX(Math.PI/2);
    }
}

defineCheckpoints()

//Deixa apenas o primeiro checkpoint visivel
scene.add(checkpoint[0])

//Deixa os checkpoints restantes perpendiculares à curva
checkpoint[0].rotateY(-Math.PI/4)
checkpoint[2].rotateY(Math.PI/2)
//checkpoint[3].rotateY(Math.PI/2)
checkpoint[6].rotateY(Math.PI/2)
checkpoint[7].rotateY(Math.PI/2)
checkpoint[8].rotateY(Math.PI/3)
checkpoint[10].rotateY(Math.PI/2)
//checkpoint[11].rotateY(Math.PI/2)

//4,6,9,12

// Verifica se um checkpoint foi atravessado
function verificaCheckpoint(){
    //Posições do checkpoint
    var raio = checkpointgeometry.parameters.radius;
    var cx, cy, cz;

    //Posições do avião
    var ax = aviao_obj.fuselagem._estacionaria.position.x;
    var ay = aviao_obj.fuselagem._estacionaria.position.y;
    var az = aviao_obj.fuselagem._estacionaria.position.z;
    
    for (var j=0; j<checkpoint.length; j++){
        cx=checkpoint[j].position.x;
        cy=checkpoint[j].position.y;
        cz=checkpoint[j].position.z;

        // Se o checkpoint foi atravessado, ele é removido da cena e outro checkpoint é adicionado
        if( ((ax>cx-raio) && (ax<cx+raio)) && ((ay>cy-raio) && (ay<cy+raio)) && ((az>cz-raio) && (az<cz+raio))){
            checkpoint[j].visible=false;
            scene.remove(checkpoint[j]);
            scene.add(checkpoint[j+1]);
            contaCheckpoints();
        }
    }
}

var contadorChecks=0;
// Conta quantos checkpoints foram atravessados. O valor é atualizado toda vez que um check é atravessado
function contaCheckpoints(){
    contadorChecks = 0;
    for (var j=0; j<checkpoint.length; j++){
        if(checkpoint[j].visible == false)
        contadorChecks++;
    }
    if(contadorChecks == checkpoint.length){
        aviao_obj.velocidade_atual = 0;
        aviao_obj.velocidade_atual = 0;
        document.getElementById(controls.infoBox.id).innerHTML = "";
        controls.add("Parabéns por completar o percurso!")
        controls.add("Checkpoint: " + contadorChecks)
        controls.add("Tempo gasto: " + seconds + "s")
        controls.add("Por favor, pressione F5 para reiniciar o jogo!")
        notifyMe();
        contadorChecks = 0;
    }
}


var seconds = 0;
// Conta quanto tempo passa do momento que o primeiro checkpoint é atravessado até o ultimo ser atravessado
function contadorTempo(){
    if(checkpoint[0].visible==false && checkpoint[checkpoint.length-1].visible==true){
        seconds++;
    }
    else
        return seconds;
}
setInterval(contadorTempo, 1000);


// Mostra ao usuário o tempo que ele levou para completar o percurso
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


//-----------------------------------//

// Adiciona uma luz hemisphereLight no ambiente
var hemisphereLight = new THREE.HemisphereLight( "white", "white", 0.2 );
scene.add( hemisphereLight );
// Luz do sol direcional posicionada no canto superior direito do plano
var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.75 );
directionalLight.position.set(2500, 2500, 2000);
directionalLight.distance = 1000;
directionalLight.penumbra = 0.2;
// Sombras
directionalLight.shadow.camera.left = -2000;
directionalLight.shadow.camera.right = 2000;
directionalLight.shadow.camera.top = 3000;
directionalLight.shadow.camera.bottom = -3000;
// Resolução das sombras
directionalLight.shadow.mapSize.width = 8192;
directionalLight.shadow.mapSize.height = 8192;
// near and far
directionalLight.shadow.camera.near = 100; // default 0.5
directionalLight.shadow.camera.far = 7000; // default 500 // 151 because 150 didn't reach the ground plane
// Faz a fonte de luz gerar sombras
directionalLight.castShadow = true;
scene.add( directionalLight );

//var directionalLightHelper = new THREE.CameraHelper( directionalLight.shadow.camera ); // creates a helper to better visualize the light
//scene.add( directionalLightHelper );










function create_Mountain(base, scale, neve, raio, n_pontos_base) { 
    let ponto_aux = []
    let passos = 6
    let x = raio, y = raio, z = 0
    let angle = Math.PI*2 / n_pontos_base
    let n_pontos_aux = n_pontos_base 
    let pontos = []
  
    for(let i = 0; i < 4; i++){
      n_pontos_aux = Math.floor(n_pontos_base - (n_pontos_base/(4)) * i)
      for (let j = 0; j < n_pontos_aux; j++) {
        let zaux = (z*Math.random() + z*0.8)
        let xaux = (x*Math.random() + x*0.8)
        let yaux = (y*Math.random() + y*0.8)
        pontos.push(new THREE.Vector3(xaux * Math.cos(angle*j), yaux * Math.sin(angle*j), zaux))
        ponto_aux.push(new THREE.Vector3(xaux * Math.cos(angle*j), yaux * Math.sin(angle*j), zaux))
      }
      x = (1 - Math.random()*0.2)*x
      y = (1 - Math.random()*0.2)*y
      z = (1 + Math.random()*0.2)*z + i
      angle = Math.PI*2 / n_pontos_aux
    }
  
    let montanha_base = new THREE.Mesh(new ConvexGeometry(pontos), new THREE.MeshLambertMaterial({color: '#00f020'}))
    scene.add(montanha_base)
    montanha_base.position.set(base.x, base.y, base.z)
    montanha_base.scale.set(scale,scale,scale)
    montanha_base.castShadow = true;
    montanha_base.receiveShadow = true;

    pontos = []
    for (let i = ponto_aux.length-1; i > ponto_aux.length - n_pontos_aux - 1 - Math.floor((n_pontos_base/(4)) * 3); i--) {
      pontos.push(ponto_aux[i])
    }
  
    n_pontos_aux = n_pontos_base
  
    for(let i = 0; i < passos; i++){
      n_pontos_aux = Math.floor(n_pontos_base - (n_pontos_base/(passos)) * i)
      for (let j = 0; j < n_pontos_aux; j++) {
        let zaux = (z*Math.random() + z*0.8)
        let xaux = (x*Math.random() + x*0.6)
        let yaux = (y*Math.random() + y*0.6)
        pontos.push(new THREE.Vector3(xaux * Math.cos(angle*j), yaux * Math.sin(angle*j), zaux))
      }
      x = (1 - Math.random()*0.4)*x
      y = (1 - Math.random()*0.4)*y
      z = (1 + Math.random()*0.2)*z
      angle = Math.PI*2 / n_pontos_aux
    }
  
    if (neve) { // Nivelar o anterior
      let ponto_neve = []
      let menor_ponto_X = 0
      let maior_ponto_X = 0
      let menor_ponto_Y = 0
      let maior_ponto_Y = 0
      let maior_ponto_Z = 0
  
      for (let index = Math.floor((n_pontos_base/(passos)*4)); index >= 0; index--) {
        ponto_neve.push(new THREE.Vector3(pontos[pontos.length - 1 - index].x,
          pontos[pontos.length - 1 - index].y,
          pontos[pontos.length - 1 - index].z))
      }
  
      ponto_neve.sort(function(a, b){return a.z-b.z})
  
      maior_ponto_Z = ponto_neve[ponto_neve.length-1] // maior Z
  
      ponto_neve.sort(function(a, b){return b.x-a.x})
      for (let i = 0; i < 4; i++) {
        maior_ponto_X = ponto_neve[i] // maior x
        menor_ponto_X = ponto_neve[ponto_neve.length-1-i] // menor x
        maior_ponto_X.z = maior_ponto_Z.z
        menor_ponto_X.z = maior_ponto_Z.z
        pontos.push(maior_ponto_X)
        pontos.push(menor_ponto_X)
      }
  
      ponto_neve.sort(function(a, b){return b.y-a.y})
      for (let i = 0; i < 4; i++) {
        maior_ponto_Y = ponto_neve[i] // maior x
        menor_ponto_Y = ponto_neve[ponto_neve.length-1-i] // menor x
        maior_ponto_Y.z = maior_ponto_Z.z
        menor_ponto_Y.z = maior_ponto_Z.z
        pontos.push(maior_ponto_Y)
        pontos.push(menor_ponto_Y)
      }
  
      let figura_2 = new THREE.Mesh(new ConvexGeometry(pontos), new THREE.MeshLambertMaterial({color: '#804000'}))
      scene.add(figura_2)
      figura_2.position.set(base.x, base.y, base.z)
      figura_2.scale.set(scale,scale,scale)
      figura_2.castShadow = true;
      figura_2.receiveShadow = true;

      let n_pontos_neve = ponto_neve.length
      //console.log("Npontoneve " + n_pontos_neve)
      for (let index = 0; index < passos; index++) {
        n_pontos_aux = Math.floor(n_pontos_neve - Math.floor(n_pontos_neve/passos) * index)
        //console.log("npontosaux " + n_pontos_aux + " I> " + index)
        for (let j = 0; j < n_pontos_aux; j++) {
          let zaux = (z)
          let xaux = (x*Math.random() + x*0.6)
          let yaux = (y*Math.random() + y*0.6)
          ponto_neve.push(new THREE.Vector3(xaux * Math.cos(angle*j), yaux * Math.sin(angle*j), zaux))
         }
        x = (1 - Math.random()*0.3)*x
        y = (1 - Math.random()*0.3)*y
        z = z + index
        angle = Math.PI*2 / n_pontos_aux
      }
  
      let figura_neve = new THREE.Mesh(new ConvexGeometry(ponto_neve), new THREE.MeshBasicMaterial({color: '#f0f0f0'}))
      scene.add(figura_neve)
      figura_neve.position.set(base.x, base.y, base.z)
      figura_neve.scale.set(scale,scale,scale)
      figura_neve.castShadow = true;
      figura_neve.receiveShadow = true;
  
    }else{
      let figura_2 = new THREE.Mesh(new ConvexGeometry(pontos), new THREE.MeshLambertMaterial({color: '#804000'}))
      scene.add(figura_2)
      figura_2.position.set(base.x, base.y, base.z)
      figura_2.scale.set(scale,scale,scale)
      figura_2.castShadow = true;
      figura_2.receiveShadow = true;
    }
  }


create_Mountain(new THREE.Vector3(-700,1300,0), 16, false, 8, 30)
create_Mountain(new THREE.Vector3(-350,1300,0), 30, true, 7, 40)
create_Mountain(new THREE.Vector3(-100,1500,0), 25, true, 7, 35)





function create_arvore(base, tipo, rotation, scale) {
    switch (tipo) {
      case 1:
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
        break;

      case 2:
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
        
        caule_2_1.rotateY(rotation)
        break;
  
      case 3:
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

        break;
    
      default:
        console.error("ERRO: " + tipo + " incorespondente")
        break;
    }
  }


function randomTreePosition(num_arvores){
    for(var i=0; i<num_arvores ;i++){
        var regiao = Math.round(getRandom(0,4.4));
        switch (regiao){
            case 0:
            create_arvore(new THREE.Vector3(getRandom(-2400,-200), getRandom(-2400,800), 0), 1, 0, getRandom(2,5)) //2 - 5
            create_arvore(new THREE.Vector3(getRandom(-2400,-200), getRandom(-2400,800), 0), 2, degreesToRadians(getRandom(0,90)), getRandom(5,10)) //rotation entre 0 e 90 e 4 até 6
            create_arvore(new THREE.Vector3(getRandom(-2400,-200), getRandom(-2400,800), 0), 3, 0, getRandom(8,10))
            break;
            case 1:
            create_arvore(new THREE.Vector3(getRandom(200,2400), getRandom(-2400,800), 0), 1, 0, getRandom(2,5)) //2 - 5
            create_arvore(new THREE.Vector3(getRandom(200,2400), getRandom(-2400,800), 0), 2, degreesToRadians(getRandom(0,90)), getRandom(5,10)) //rotation entre 0 e 90 e 4 até 6
            create_arvore(new THREE.Vector3(getRandom(200,2400), getRandom(-2400,800), 0), 3, 0, getRandom(8,10))
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
            create_arvore(new THREE.Vector3(getRandom(-2400,800), getRandom(-1000,2400), 0), 1, 0, getRandom(2,5)) //2 - 5
            create_arvore(new THREE.Vector3(getRandom(-2400,800), getRandom(-1000,2400), 0), 2, degreesToRadians(getRandom(0,90)), getRandom(5,10)) //rotation entre 0 e 90 e 4 até 6
            create_arvore(new THREE.Vector3(getRandom(-2400,800), getRandom(-1000,2400), 0), 3, 0, getRandom(8,10))
            break;
        }
    }

}
randomTreePosition(50)























  
// Enable Shadows in the Renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
buildInterface();
render();

// Função de renderização do Three.js
function render() {
    stats.update(); // Update FPS
    keyboardUpdate();
    requestAnimationFrame(render);
    renderer.render(scene, camera); // Render scene
    if(isSimulacao){
        trackballControls.update();
        plano.visible = false;
        axesHelper.visible = true;
    }else{
        plano.visible = true;
        axesHelper.visible = false;
        movimento();

        //Flight School
        verificaCheckpoint();
    }
}
