# Installazione Heriverse

<!-- documentation-map:start -->
## Where the documentation lives

Every tool of the two families keeps its manual beside its code, and publishes it at one of the two addresses below. A manual is changed in the repository of its own tool, never here.

| Tool | Code | Manual | Published at |
| --- | --- | --- | --- |
| **Extended Matrix** | | | |
| Extended Matrix (the language) | [`zalmoxes-laran/ExtendedMatrix`](https://github.com/zalmoxes-laran/ExtendedMatrix) | [`zalmoxes-laran/ExtendedMatrix-doc`](https://github.com/zalmoxes-laran/ExtendedMatrix-doc) | <https://docs.extendedmatrix.org/en/1.5/> |
| EMStudio (editor) | [`ExtendedMatrix/EMStudio`](https://github.com/ExtendedMatrix/EMStudio) | [`ExtendedMatrix/EMStudio-doc`](https://github.com/ExtendedMatrix/EMStudio-doc) | <https://docs.extendedmatrix.org/projects/emstudio-doc/en/1.6/> |
| EM Tools (Blender add-on) | [`zalmoxes-laran/EM-blender-tools`](https://github.com/zalmoxes-laran/EM-blender-tools) | [`zalmoxes-laran/EM-blender-tools-doc`](https://github.com/zalmoxes-laran/EM-blender-tools-doc) | <https://docs.extendedmatrix.org/projects/EM-tools/en/1.5/> |
| s3Dgraphy (library) | [`ExtendedMatrix/s3Dgraphy`](https://github.com/ExtendedMatrix/s3Dgraphy) | same repository, `docs/` | <https://docs.extendedmatrix.org/projects/s3dgraphy/en/v1.5/> |
| 3D Survey Collection | [`zalmoxes-laran/3D-survey-collection`](https://github.com/zalmoxes-laran/3D-survey-collection) | [`zalmoxes-laran/3D-survey-collection-doc`](https://github.com/zalmoxes-laran/3D-survey-collection-doc) | <https://docs.extendedmatrix.org/projects/3DSC/en/1.7.0/> |
| Heriverse (web runtime) | [`StratiGraph-ECCCH/Heriverse`](https://github.com/StratiGraph-ECCCH/Heriverse) | [`StratiGraph-ECCCH/Heriverse-doc`](https://github.com/StratiGraph-ECCCH/Heriverse-doc) | <https://docs.extendedmatrix.org/projects/heriverse/en/1.5/> |
| **StratiGraph** | | | |
| The node, and its catalogue | [`StratiGraph-ECCCH/stratigraph-server`](https://github.com/StratiGraph-ECCCH/stratigraph-server) | same repository, `docs/` | <https://docs.stratigraph-eccch.eu/projects/node/en/latest/> |
| StratiField (field assistant) | [`StratiGraph-ECCCH/stratigraph-stratifield`](https://github.com/StratiGraph-ECCCH/stratigraph-stratifield) | same repository, `docs/` | <https://docs.stratigraph-eccch.eu/projects/field/en/latest/> |
| Recording templates | [`StratiGraph-ECCCH/stratigraph-templates`](https://github.com/StratiGraph-ECCCH/stratigraph-templates) | same repository, `docs/` | <https://docs.stratigraph-eccch.eu/projects/templates/en/v0.1.0/> |
| The welcome page of the manuals | — | [`StratiGraph-ECCCH/stratigraph-docs`](https://github.com/StratiGraph-ECCCH/stratigraph-docs) | <https://docs.stratigraph-eccch.eu> |
| The StratiGraph Academy | — | [`StratiGraph-ECCCH/stratigraph-academy`](https://github.com/StratiGraph-ECCCH/stratigraph-academy) | <https://academy.stratigraph-eccch.eu> |

<!-- documentation-map:end -->

## Installazione Aton
Come primo passaggio è necessario installare Aton seguendo la guida all'installazione ufficiale: https://osiris.itabc.cnr.it/aton/index.php/tutorials/getting-started/run-deploy/

É necessario configurare Aton per le comunicazioni tramite HTTPs

## Installazione del servizio Auth
Il passaggio successivo consiste nell'installare il flare Auth disponibile al seguente link: https://github.com/digilab-it/Auth.git

## Installazione del progetto
1. Da terminale, posizionarsi nella directory principale di Aton;
2. Eseguire il comando `cd ./wapps`;
3. Eseguire il comando `git clone https://github.com/digilab-it/Heriverse.git`;
4. Attendere la terminazione del processo ed eseguire il comando `cd ./heriverse`;

## Configurazione variabili di sistema
1. Aprire con un editor di testo il file Utils.js presente nella cartella /src;
2. Verificare che i valori presenti nel seguente blocco siano impostati correttamente
```js
Utils.clientId = ClientId_Digilab;
Utils.baseHost = "https://localhost:8083/h2iosc/";
Utils.baseUrl = "https://localhost:8083/a/heriverse";
```

## Eseguire la webapp
1. Da terminale, posizionarsi nella cartella principale di Aton;
2. Eseguire il comando `pm2 start`;
3. Visitare il link https://localhost:8083/a/heriverse/ ;

Per l'utilizzo dell'app, fare riferimento al manuale presente nel repository.
