# CG2021-1
Repositório para resolução das atividades da disciplina DCC065 - Computação Gráfica, do curso de Engenharia Computacional da UFJF.


Versão 01 do Trabalho de simulação de voo e modelagem de avião:
![alt text](https://github.com/MathewsJosh/CG2021-1/tree/main/readme_imgs/Trabalho01.gif "Logo Title Text 1")









Versão atual: r128dev

-- Passo-a-passo para atualização do Three.js -------------------------------------------

* Remover todos os arquivos da pasta "CG/build"

* Em uma pasta qualquer (chamada aqui de 'npmBuild'), abrir um terminal e 
  executar o seguinte comando para baixar os módulos do three.js:
    npm install --save three

* Dos arquivos gerados, copiar para a pasta CG os seguintes:
  npmBuild/node_modules/three/build/*          -->  CG/build/  
  npmBuild/node_modules/three/examples/jsm/*   -->  CG/build/jsm
  
-------------------------------------------------

Para ver a versão em execução do Three.js, com a aplicação em tela inteira digitar 
no console do Chrome:
THREE.REVISION