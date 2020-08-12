const blockingSwitch = document.querySelector('#blocking');
blockingSwitch.addEventListener('click', () => {
    setAllowing(blockingSwitch.checked);
});

const blockBtn = document.querySelector('#blockBtn');
blockBtn.addEventListener('click', () => {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        const url = new URL(tab.url);
        const domain = url.hostname;
        
        addToBlockList(domain);
      });
});

const clearBtn = document.querySelector('#clearBtn');
clearBtn.addEventListener('click', () => {
    browser.storage.local.clear();
    clearTimeout();
    buildBlockList();
});

const log = (data) => {
    browser.tabs.query({
        currentWindow: true,
        active: true
      }).then((tabs) => {
          browser.tabs.sendMessage(tabs[0].id, data);
    })
}

const addToBlockList = (domain) => {
    log('adding');
    getBlockList((oldBlockList) => {
        clearTimeout();
        if (!oldBlockList.includes(domain)){
            updateBlockList([...oldBlockList, domain]);
        } 
    });
}

const setAllowing = (value) => {
    log(`Setting allowing as ${!value}`)
    browser.storage.local.get('dont')
        .then(data => {
            let dont = {};
            if (data) {
                if (data.dont) {
                    dont = data.dont;
                    dont.allowing = !value;
                } else {
                    dont.allowing = !value;
                }
            } else {
                    dont.allowing = !value;
                }
            browser.storage.local.set({dont});
        });
}

const isAllowing = (callback) => {
    setTimeout(() => {
        browser.storage.local.get('dont')
            .then((data) => {
                clearTimeout();
                if (data) {
                    log('getting isAllowing');
                    if (data.dont) {
                        if (data.dont.allowing) {
                            const allowing = data.dont.allowing;
                            return callback(blocking)
                        } else {
                            return callback(false);
                        }
                    }
                } else {
                    return callback(false);
                }
            })
    }, 500);
}

const getBlockList = (callback) => {
    setTimeout( () => {
        browser.storage.local.get('dont')
        .then((data) => {
            clearTimeout();
            if (data) {
                log('getting blocklist');
                if (data.dont){
                    if (data.dont.blockList)  {
                        if(data.dont.blockList.length > 0){
                            let blockList = data.dont.blockList;
                            return callback(blockList);
                        }
                    }
                }
            } 
            return callback([]);
        });
    }, 500 )
}

const updateBlockList = (newBlockList) => {
    log('updating')
    if (newBlockList.length !== 0){
        let dont = {
            blockList: newBlockList
        }
        
        browser.storage.local.set({dont});
    } else {
        browser.storage.local.clear();
    }
    buildBlockList();
}

const removeFromBlockList = (domain) => {
    log('removing');
    getBlockList((blockList) => {
        blockList = blockList.filter((item) => {
            if ( item === domain ) {
                return false
            } else {
                return true
            }
        })
        updateBlockList(blockList);
    })
}

const buildBlockList = () => {
    isAllowing((allowing) => {
        const blockingSwitch = document.querySelector('#blocking');
        blockingSwitch.checked = !allowing;
    });

    const blockListContainer = document.querySelector('#blockList');
    blockListContainer.innerHTML = '';
    getBlockList((blockList) => {
        log(`Build: ${blockList}`)
    
        if ( blockList ) {
            for ( let i=0; i<blockList.length; i++ ) {
                let blockedHostLink = document.createElement('a');
                blockedHostLink.href = `https:\\${blockList[i]}`;
                blockedHostLink.target = "_blank";
                blockedHostLink.innerText = blockList[i];
                
                let removeBlockedHostBtn = document.createElement('button');
                removeBlockedHostBtn.innerText = 'Remove';
                removeBlockedHostBtn.value = blockList[i];
                removeBlockedHostBtn.addEventListener('click', (e) => {
                    removeFromBlockList(e.target.value);
                    removeBlockedHostBtn.removeEventListener('click');
                })
                
                let row = document.createElement('tr')
                let col1 = document.createElement('td');
                let col2 = document.createElement('td');
                
                col1.appendChild(blockedHostLink);
                col2.appendChild(removeBlockedHostBtn);
                
                row.appendChild(col1);
                row.appendChild(col2);
                
                blockListContainer.appendChild(row);                
            }
        }else{
            log('nothing to build');
        }
    });
}

buildBlockList();