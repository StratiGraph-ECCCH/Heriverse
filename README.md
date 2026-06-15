# Installazione Heriverse

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
