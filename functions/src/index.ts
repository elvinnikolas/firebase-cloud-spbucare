import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as express from 'express'
import * as bodyParser from 'body-parser'
// import { FieldValue } from '@google-cloud/firestore'

admin.initializeApp(functions.config().firebase)
const auth = admin.auth()
const db = admin.firestore()

const app = express()
const main = express()
main.use('/api/v1', app)
main.use(bodyParser.json())

export const webApi = functions.https.onRequest(main)

//create auth
app.get('/auth/:email/:password', async (request, response) => {
    const email = request.params.email
    const password = request.params.password

    auth.createUser({
        email: email,
        password: password
    })
        .then(function (userRecord) {
            response.json(userRecord.uid)
        })
        .catch(function (error) {
            console.log('Error creating new user:', error)
        })
})

//update auth
app.post('/auth/:uid/:email/:password', async (request, response) => {
    const uid = request.params.uid
    const email = request.params.email
    const password = request.params.password

    auth.updateUser(uid, {
        email: email,
        password: password
    })
        .then(function (userRecord) {
            console.log('Successfully updated user', userRecord.toJSON())
        })
        .catch(function (error) {
            console.log('Error updating user:', error)
        })
})

//update SR
app.put('/updateSR', async (request, response) => {
    try {
        const users = await db.collection('users').get()

        let userId, name, salesRetailId, kode
        users.forEach(
            async (doc) => {
                userId = doc.data().userId
                name = doc.data().name
                kode = String(name.substr(2, 3))
                if (kode === '651' || kode === '653' || kode === '661') {
                    salesRetailId = '6MARPQw4ToVY1uZBqckD5dLeEJm1'
                } else if (kode === '662') {
                    salesRetailId = 'Abq4TLEs6zUccXVTPm8JtIuXeHE3'
                } else if (kode === '673') {
                    salesRetailId = '0Nv8LiPFx5NnvnYMptxu4rxrHy12'
                } else {
                    salesRetailId = ''
                }

                const data = {
                    salesRetailId
                }

                await db.collection('users').doc(userId).set(data, { merge: true })
                    .then(function () {
                        console.log('Success')
                    })
                    .catch(function (error) {
                        console.log(error)
                    })
            }
        )
        response.status(200).send('success')

    } catch (error) {
        response.status(500).send(error)
    }
})

//delete user
app.delete('/deleteUser/:uid', async (request, response) => {
    try {
        const uid = request.params.uid

        admin.auth().deleteUser(uid)
            .then(function () {
                console.log('Successfully deleted user: ' + uid)
            })
            .catch(function (error) {
                console.log('Error deleting user:', error)
            })

        db.collection('users').doc(uid).delete()
            .then(function () {
                console.log('Success: delete user collection ' + uid)
            })
            .catch(function (error) {
                console.log(error)
            })

        response.json(uid)

    } catch (error) {
        response.status(500).send(error)
    }
})

//create order manual
app.post('/order/:name', async (request, response) => {
    try {
        const name = request.params.name
        const applicantName = name
        let {
            createdOn,
            description,
            modifiedOn,
            orderVolume,
            soNumber,
            type
        } = request.body

        const orderConfirmation = {
            "complete": true,
            "confirmOH": true,
            "confirmPN": true,
            "confirmSR": true,
            "confirmSSGA": true
        }

        let userId, adress
        const users = await db.collection('users').get()
        users.forEach(
            (doc) => {
                if (doc.data().name === name) {
                    userId = doc.data().userId
                    adress = doc.data().adress
                } else {
                    //
                }
            }
        )

        let kode, salesRetailId
        kode = String(name.substr(2, 3))
        if (kode === '651' || kode === '653' || kode === '661') {
            salesRetailId = '6MARPQw4ToVY1uZBqckD5dLeEJm1'
        } else if (kode === '662') {
            salesRetailId = 'Abq4TLEs6zUccXVTPm8JtIuXeHE3'
        } else if (kode === '673') {
            salesRetailId = '0Nv8LiPFx5NnvnYMptxu4rxrHy12'
        } else {
            salesRetailId = ''
        }

        const orders = await db.collection('orders').doc()
        const orderId = orders.id
        const open = false
        const manual = true
        createdOn = new Date(createdOn)
        modifiedOn = new Date(modifiedOn)

        const data = {
            adress,
            applicantName,
            createdOn,
            description,
            manual,
            modifiedOn,
            open,
            orderId,
            orderConfirmation,
            orderVolume,
            salesRetailId,
            soNumber,
            type,
            userId
        }

        await db.doc('orders/' + orderId).set(data, { merge: true })
            .then(function () {
                console.log('Success: create new order ' + orderId)
            })
            .catch(function (error) {
                console.log(error)
            })

        await db.doc('users/' + userId + '/orders/' + orderId).set(data, { merge: true })
            .then(function () {
                console.log('Success: create new order ' + name)
            })
            .catch(function (error) {
                console.log(error)
            })

        const order = await db.doc('orders/' + orderId).get()
        response.json(order.data())

    } catch (error) {
        response.status(500).send(error)
    }
})

//create user
app.post('/user/:id', async (request, response) => {
    try {
        const userId = request.params.id
        const {
            operator,
            name,
            adress,
            token,
            employeeNumber,
            type,
            pertamina,
            profileImage,
            picName,
            phone,
            position,
            salesRetailId
        } = request.body

        const data = {
            operator,
            name,
            adress,
            token,
            employeeNumber,
            type,
            pertamina,
            profileImage,
            picName,
            phone,
            position,
            salesRetailId
        }

        await db.doc('users/' + userId).set(data, { merge: true })
            .then(function () {
                console.log('Success: create new user ' + name)
            })
            .catch(function (error) {
                console.log(error)
            })

        const user = await db.doc('users/' + userId).get()
        response.json(user.data())

    } catch (error) {
        response.status(500).send(error)
    }
})

//deklarasi variabel global
let idNotification = ''
const ssgaId = '1GJiQL1yVPULwtM5BiacBXDCv8Y2'
const ohId = 'pyo93kufMWa5yRiIQ82w9q454n13'
const rsdId = 'X4jZuGcsdqRTZx1mxozZGHdgF412'
const pnId = 'OGliHFqeIVRsM00G2Kq1CrnSKEu1'
const pnId2 = 'L7y1xKvPfBOpqOsZ1dOX9T9emJi2'
const pnId3 = 'zkDNpefrZzeZtrZ8iGVEN2MfxsY2'
// const arr_pnId = ['OGliHFqeIVRsM00G2Kq1CrnSKEu1', 'L7y1xKvPfBOpqOsZ1dOX9T9emJi2', 'zkDNpefrZzeZtrZ8iGVEN2MfxsY2']

//trigger create order
exports.onCreateOrder = functions.firestore
    .document('users/{userId}/orders/{orderId}')
    .onCreate(async (snapshot, context) => {
        try {
            const userId = context.params.userId
            const orderId = context.params.orderId

            const user = await db.collection('users').doc(userId).get()
            const order = await db.collection('users/' + userId + '/orders').doc(orderId).get()

            const dataUser = user.data()
            let nameUser, srId, registrationTokenUser, userType
            if (dataUser !== undefined) {
                nameUser = dataUser.name
                srId = dataUser.salesRetailId
                registrationTokenUser = dataUser.token
                userType = dataUser.type
            }

            const dataOrder = order.data()
            let type, manual, stringVolume, stringSO
            let biosolar, dexlite, pertadex, pertalite, pertamax, premium, pxturbo
            if (dataOrder !== undefined) {
                if (dataOrder.orderVolume.biosolar !== 0) {
                    biosolar = "biosolar " + String(dataOrder.orderVolume.biosolar) + " kl, "
                } else { biosolar = "" }
                if (dataOrder.orderVolume.dexlite !== 0) {
                    dexlite = "dexlite " + String(dataOrder.orderVolume.dexlite) + " kl, "
                } else { dexlite = "" }
                if (dataOrder.orderVolume.pertadex !== 0) {
                    pertadex = "pertadex " + String(dataOrder.orderVolume.pertadex) + " kl, "
                } else { pertadex = "" }
                if (dataOrder.orderVolume.pertalite !== 0) {
                    pertalite = "pertalite " + String(dataOrder.orderVolume.pertalite) + " kl, "
                } else { pertalite = "" }
                if (dataOrder.orderVolume.pertamax !== 0) {
                    pertamax = "pertamax " + String(dataOrder.orderVolume.pertamax) + " kl, "
                } else { pertamax = "" }
                if (dataOrder.orderVolume.premium !== 0) {
                    premium = "premium " + String(dataOrder.orderVolume.premium) + " kl, "
                } else { premium = "" }
                if (dataOrder.orderVolume.pxturbo !== 0) {
                    pxturbo = "pxturbo " + String(dataOrder.orderVolume.pxturbo) + " kl, "
                } else { pxturbo = "" }
                if (dataOrder.soNumber !== "") {
                    stringSO = "\nNomor SO: " + String(dataOrder.soNumber)
                } else { stringSO = "" }

                stringVolume = biosolar + dexlite + pertadex + pertalite + pertamax + premium + pxturbo
                stringVolume = stringVolume.substr(0, stringVolume.length - 2)
                type = dataOrder.type
                manual = dataOrder.manual
            }

            if (manual) {
                console.log("Input manual")
            } else {
                const notificationsUser = await db.collection('users/' + userId + '/notifications').doc()
                const notificationIdUser = notificationsUser.id
                const titleUser = "Terima Kasih"
                const bodyUser = "Anda telah menggunakan layanan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + ".\nMohon menunggu persetujuan dari TBBM Malang"

                const notificationsAtasan = await db.collection('users/' + srId + '/notifications').doc()
                const notificationIdAtasan = notificationsAtasan.id
                const titleAtasan = "SPBU " + String(nameUser)
                const status = "\nMenunggu konfirmasi dari SR"
                const bodyAtasan = "Terdapat permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + stringSO + status

                const open = true
                const createdOn = admin.firestore.Timestamp.now()

                //function update document notification
                async function updateDocumentNotification(id: any, notifId: any, notifData: any, log: String) {
                    await db.doc('users/' + id + "/notifications/" + notifId).set(notifData, { merge: true })
                        .then(function () {
                            console.log(log)
                        })
                        .catch(function (error) {
                            console.log(error)
                        })
                }

                await db.collection('users/' + ssgaId + '/notifications').doc(notificationIdAtasan)
                await db.collection('users/' + ohId + '/notifications').doc(notificationIdAtasan)
                await db.collection('users/' + rsdId + '/notifications').doc(notificationIdAtasan)
                await db.collection('users/' + pnId + '/notifications').doc(notificationIdAtasan)
                await db.collection('users/' + pnId2 + '/notifications').doc(notificationIdAtasan)
                await db.collection('users/' + pnId3 + '/notifications').doc(notificationIdAtasan)

                idNotification = notificationIdAtasan

                let notificationId, title, body
                notificationId = notificationIdUser
                title = titleUser
                body = bodyUser
                const notificationDataUser = {
                    notificationId,
                    orderId,
                    createdOn,
                    title,
                    body,
                    open,
                    type
                }
                notificationId = notificationIdAtasan
                title = titleAtasan
                body = bodyAtasan
                const notificationDataAtasan = {
                    notificationId,
                    orderId,
                    createdOn,
                    title,
                    body,
                    open,
                    type
                }

                updateDocumentNotification(userId, notificationIdUser, notificationDataUser, 'Success: create notification user').then(() => console.log('success')).catch((error) => console.log(error))
                updateDocumentNotification(srId, notificationIdAtasan, notificationDataAtasan, 'Success: create notification SR').then(() => console.log('success')).catch((error) => console.log(error))
                updateDocumentNotification(ssgaId, notificationIdAtasan, notificationDataAtasan, 'Success: create notification SSGA').then(() => console.log('success')).catch((error) => console.log(error))
                updateDocumentNotification(rsdId, notificationIdAtasan, notificationDataAtasan, 'Success: create notification RSD').then(() => console.log('success')).catch((error) => console.log(error))
                updateDocumentNotification(ohId, notificationIdAtasan, notificationDataAtasan, 'Success: create notification OH').then(() => console.log('success')).catch((error) => console.log(error))
                updateDocumentNotification(pnId, notificationIdAtasan, notificationDataAtasan, 'Success: create notification PN').then(() => console.log('success')).catch((error) => console.log(error))
                updateDocumentNotification(pnId2, notificationIdAtasan, notificationDataAtasan, 'Success: create notification PN').then(() => console.log('success')).catch((error) => console.log(error))
                updateDocumentNotification(pnId3, notificationIdAtasan, notificationDataAtasan, 'Success: create notification PN').then(() => console.log('success')).catch((error) => console.log(error))

                //notifikasi user
                const messageUser = {
                    data: {
                        "title": titleUser,
                        "body": bodyUser,
                        "type": type,
                        "userType": userType
                    },
                    token: registrationTokenUser
                }

                //notifikasi atasan
                const docPN = await db.collection('users').doc(pnId).get()
                const dtPN = docPN.data()
                let registrationTokenPN, userTypePN
                if (dtPN !== undefined) {
                    registrationTokenPN = dtPN.token
                    userTypePN = dtPN.type
                }
                const docPN2 = await db.collection('users').doc(pnId2).get()
                const dtPN2 = docPN2.data()
                let registrationTokenPN2, userTypePN2
                if (dtPN2 !== undefined) {
                    registrationTokenPN2 = dtPN2.token
                    userTypePN2 = dtPN2.type
                }
                const docPN3 = await db.collection('users').doc(pnId3).get()
                const dtPN3 = docPN3.data()
                let registrationTokenPN3, userTypePN3
                if (dtPN3 !== undefined) {
                    registrationTokenPN3 = dtPN3.token
                    userTypePN3 = dtPN3.type
                }
                const docOH = await db.collection('users').doc(ohId).get()
                const dtOH = docOH.data()
                let registrationTokenOH, userTypeOH
                if (dtOH !== undefined) {
                    registrationTokenOH = dtOH.token
                    userTypeOH = dtOH.type
                }
                const docRSD = await db.collection('users').doc(rsdId).get()
                const dtRSD = docRSD.data()
                let registrationTokenRSD, userTypeRSD
                if (dtRSD !== undefined) {
                    registrationTokenRSD = dtRSD.token
                    userTypeRSD = dtRSD.type
                }
                const docSSGA = await db.collection('users').doc(ssgaId).get()
                const dtSSGA = docSSGA.data()
                let registrationTokenSSGA, userTypeSSGA
                if (dtSSGA !== undefined) {
                    registrationTokenSSGA = dtSSGA.token
                    userTypeSSGA = dtSSGA.type
                }
                const docSR = await db.collection('users').doc(srId).get()
                const dtSR = docSR.data()
                let registrationTokenSR, userTypeSR
                if (dtSR !== undefined) {
                    registrationTokenSR = dtSR.token
                    userTypeSR = dtSR.type
                }

                title = "Permintaan Baru"
                body = "Terdapat permintaan " + String(type).toUpperCase() + " dari SPBU " + String(nameUser).toUpperCase()

                const messagePN = {
                    data: {
                        "title": title,
                        "body": body,
                        "type": type,
                        "userType": userTypePN
                    },
                    token: registrationTokenPN
                }
                const messagePN2 = {
                    data: {
                        "title": title,
                        "body": body,
                        "type": type,
                        "userType": userTypePN2
                    },
                    token: registrationTokenPN2
                }
                const messagePN3 = {
                    data: {
                        "title": title,
                        "body": body,
                        "type": type,
                        "userType": userTypePN3
                    },
                    token: registrationTokenPN3
                }
                const messageOH = {
                    data: {
                        "title": title,
                        "body": body,
                        "type": type,
                        "userType": userTypeOH
                    },
                    token: registrationTokenOH
                }
                const messageRSD = {
                    data: {
                        "title": title,
                        "body": body,
                        "type": type,
                        "userType": userTypeRSD
                    },
                    token: registrationTokenRSD
                }
                const messageSSGA = {
                    data: {
                        "title": title,
                        "body": body,
                        "type": type,
                        "userType": userTypeSSGA
                    },
                    token: registrationTokenSSGA
                }
                const messageSR = {
                    data: {
                        "title": title,
                        "body": body,
                        "type": type,
                        "userType": userTypeSR
                    },
                    token: registrationTokenSR
                }

                sendNotification(messageSR)
                sendNotification(messageSSGA)
                sendNotification(messageRSD)
                sendNotification(messageOH)
                sendNotification(messagePN)
                sendNotification(messagePN2)
                sendNotification(messagePN3)
                sendNotification(messageUser)
            }

        } catch (error) {
            console.log(error)
        }
    })


//trigger update order
exports.onUpdateOrder = functions.firestore
    .document('users/{userId}/orders/{orderId}')
    .onUpdate(async (change, context) => {
        try {
            const userId = context.params.userId
            const orderId = context.params.orderId
            const newValue = change.after.data()
            const previousValue = change.before.data()

            const user = await db.collection('users').doc(userId).get()
            const order = await db.collection('orders').doc(orderId).get()

            const dataUser = user.data()
            let registrationTokenUser, nameUser, srId, userType
            //mendapatkan isi field document dari user ybs
            if (dataUser !== undefined) {
                registrationTokenUser = dataUser.token
                nameUser = dataUser.name
                srId = dataUser.salesRetailId
                userType = dataUser.type
            }

            const dataOrder = order.data()
            let type, stringVolume, stringSO
            let biosolar, dexlite, pertadex, pertalite, pertamax, premium, pxturbo
            if (dataOrder !== undefined) {
                if (dataOrder.orderVolume.biosolar !== 0) {
                    biosolar = "biosolar " + String(dataOrder.orderVolume.biosolar) + " kl, "
                } else { biosolar = "" }
                if (dataOrder.orderVolume.dexlite !== 0) {
                    dexlite = "dexlite " + String(dataOrder.orderVolume.dexlite) + " kl, "
                } else { dexlite = "" }
                if (dataOrder.orderVolume.pertadex !== 0) {
                    pertadex = "pertadex " + String(dataOrder.orderVolume.pertadex) + " kl, "
                } else { pertadex = "" }
                if (dataOrder.orderVolume.pertalite !== 0) {
                    pertalite = "pertalite " + String(dataOrder.orderVolume.pertalite) + " kl, "
                } else { pertalite = "" }
                if (dataOrder.orderVolume.pertamax !== 0) {
                    pertamax = "pertamax " + String(dataOrder.orderVolume.pertamax) + " kl, "
                } else { pertamax = "" }
                if (dataOrder.orderVolume.premium !== 0) {
                    premium = "premium " + String(dataOrder.orderVolume.premium) + " kl, "
                } else { premium = "" }
                if (dataOrder.orderVolume.pxturbo !== 0) {
                    pxturbo = "pxturbo " + String(dataOrder.orderVolume.pxturbo) + " kl, "
                } else { pxturbo = "" }
                if (dataOrder.soNumber !== "") {
                    stringSO = "\nNomor SO: " + String(dataOrder.soNumber)
                } else { stringSO = "" }

                stringVolume = biosolar + dexlite + pertadex + pertalite + pertamax + premium + pxturbo
                stringVolume = stringVolume.substr(0, stringVolume.length - 2)
                type = dataOrder.type
            }

            let n_complete, p_complete
            let n_confirmOH, p_confirmOH
            let n_confirmPN, p_confirmPN
            let n_confirmSR, p_confirmSR
            let n_confirmSSGA, p_confirmSSGA

            //mendapatkan nilai seluruh field sesudah diupdate
            if (newValue !== undefined) {
                n_complete = newValue.orderConfirmation.complete
                n_confirmOH = newValue.orderConfirmation.confirmOH
                n_confirmPN = newValue.orderConfirmation.confirmPN
                n_confirmSR = newValue.orderConfirmation.confirmSR
                n_confirmSSGA = newValue.orderConfirmation.confirmSSGA
            }

            //mendapatkan nilai seluruh field sebelum diupdate
            if (previousValue !== undefined) {
                p_complete = previousValue.orderConfirmation.complete
                p_confirmOH = previousValue.orderConfirmation.confirmOH
                p_confirmPN = previousValue.orderConfirmation.confirmPN
                p_confirmSR = previousValue.orderConfirmation.confirmSR
                p_confirmSSGA = previousValue.orderConfirmation.confirmSSGA
            }

            //function update document notification
            async function updateDocumentNotification(id: any, notificationData: any, log: String) {
                await db.doc('users/' + id + "/notifications/" + idNotification).set(notificationData, { merge: true })
                    .then(function () {
                        console.log(log)
                    })
                    .catch(function (error) {
                        console.log(error)
                    })
            }

            //ditolak
            if (n_complete !== p_complete && n_complete === true && n_confirmPN === false) {
                let title = "Permintaan Ditolak"
                const open = false
                const createdOn = admin.firestore.Timestamp.now()

                //tolak SR
                if (n_confirmOH === false && n_confirmPN === false && n_confirmSR === false && n_confirmSSGA === false) {
                    console.log('TOLAK SR')

                    //buat dokumen notification
                    const notifications = await db.collection('users/' + userId + '/notifications').doc()
                    const notificationId = notifications.id
                    let body = "Mohon maaf, permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " yang diajukan tidak disetujui oleh TBBM Malang"

                    const notificationData = {
                        notificationId,
                        createdOn,
                        title,
                        body,
                        open,
                        type
                    }

                    updateDocumentNotification(userId, notificationData, 'Success: update notification user').then(() => console.log('success ' + notificationId)).catch((error) => console.log(error))

                    //notifikasi
                    const messageUser = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userType
                        },
                        token: registrationTokenUser
                    }

                    //buat dokumen notification
                    title = "SPBU " + String(nameUser).toUpperCase() + " (TOLAK)"
                    body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " ditolak oleh SR" + stringSO

                    const notificationDataAtasan = {
                        createdOn,
                        title,
                        body,
                        open
                    }

                    const snapNotification =
                        await db.collection('users/' + srId + '/notifications')
                            .where("orderId", "==", orderId)
                            .where("open", "==", true)
                            .get()

                    snapNotification.forEach(
                        (doc) => {
                            idNotification = doc.data().notificationId
                        }
                    )

                    updateDocumentNotification(srId, notificationDataAtasan, 'Success: update notification SR').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ssgaId, notificationDataAtasan, 'Success: update notification SSGA').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(rsdId, notificationDataAtasan, 'Success: update notification RSD').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ohId, notificationDataAtasan, 'Success: update notification OH').then(() => console.log('success')).catch((error) => console.log(error))
                    updateDocumentNotification(pnId, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId2, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId3, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))

                    //notifikasi atasan
                    const docPN = await db.collection('users').doc(pnId).get()
                    const dtPN = docPN.data()
                    let registrationTokenPN, userTypePN
                    if (dtPN !== undefined) {
                        registrationTokenPN = dtPN.token
                        userTypePN = dtPN.type
                    }
                    const docPN2 = await db.collection('users').doc(pnId2).get()
                    const dtPN2 = docPN2.data()
                    let registrationTokenPN2, userTypePN2
                    if (dtPN2 !== undefined) {
                        registrationTokenPN2 = dtPN2.token
                        userTypePN2 = dtPN2.type
                    }
                    const docPN3 = await db.collection('users').doc(pnId3).get()
                    const dtPN3 = docPN3.data()
                    let registrationTokenPN3, userTypePN3
                    if (dtPN3 !== undefined) {
                        registrationTokenPN3 = dtPN3.token
                        userTypePN3 = dtPN3.type
                    }
                    const docOH = await db.collection('users').doc(ohId).get()
                    const dtOH = docOH.data()
                    let registrationTokenOH, userTypeOH
                    if (dtOH !== undefined) {
                        registrationTokenOH = dtOH.token
                        userTypeOH = dtOH.type
                    }
                    const docRSD = await db.collection('users').doc(rsdId).get()
                    const dtRSD = docRSD.data()
                    let registrationTokenRSD, userTypeRSD
                    if (dtRSD !== undefined) {
                        registrationTokenRSD = dtRSD.token
                        userTypeRSD = dtRSD.type
                    }
                    const docSSGA = await db.collection('users').doc(ssgaId).get()
                    const dtSSGA = docSSGA.data()
                    let registrationTokenSSGA, userTypeSSGA
                    if (dtSSGA !== undefined) {
                        registrationTokenSSGA = dtSSGA.token
                        userTypeSSGA = dtSSGA.type
                    }
                    const docSR = await db.collection('users').doc(srId).get()
                    const dtSR = docSR.data()
                    let registrationTokenSR, userTypeSR
                    if (dtSR !== undefined) {
                        registrationTokenSR = dtSR.token
                        userTypeSR = dtSR.type
                    }

                    title = "Permintaan SPBU " + String(nameUser).toUpperCase() + " ditolak"
                    body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " ditolak oleh SR"
                    const messagePN = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN
                        },
                        token: registrationTokenPN
                    }
                    const messagePN2 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN2
                        },
                        token: registrationTokenPN2
                    }
                    const messagePN3 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN3
                        },
                        token: registrationTokenPN3
                    }
                    const messageOH = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeOH
                        },
                        token: registrationTokenOH
                    }
                    const messageRSD = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeRSD
                        },
                        token: registrationTokenRSD
                    }
                    const messageSSGA = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSSGA
                        },
                        token: registrationTokenSSGA
                    }
                    const messageSR = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSR
                        },
                        token: registrationTokenSR
                    }

                    sendNotification(messageSR)
                    sendNotification(messageSSGA)
                    sendNotification(messageRSD)
                    sendNotification(messageOH)
                    sendNotification(messagePN)
                    sendNotification(messagePN2)
                    sendNotification(messagePN3)
                    sendNotification(messageUser)
                }

                //tolak SSGA
                else if (n_confirmOH === true && n_confirmPN === false && n_confirmSR === true && n_confirmSSGA === false) {
                    console.log('TOLAK SSGA')

                    //buat dokumen notification
                    const notifications = await db.collection('users/' + userId + '/notifications').doc()
                    const notificationId = notifications.id
                    let body = "Mohon maaf, permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " yang diajukan tidak disetujui oleh TBBM Malang"

                    const notificationData = {
                        notificationId,
                        createdOn,
                        title,
                        body,
                        open,
                        type
                    }

                    updateDocumentNotification(userId, notificationData, 'Success: update notification user').then(() => console.log('success ' + notificationId)).catch((error) => console.log(error))

                    //notifikasi
                    const messageUser = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userType
                        },
                        token: registrationTokenUser
                    }

                    //buat dokumen notification
                    title = "SPBU " + String(nameUser).toUpperCase() + " (TOLAK)"
                    body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " ditolak oleh SSGA" + stringSO

                    const notificationDataAtasan = {
                        createdOn,
                        title,
                        body,
                        open
                    }

                    const snapNotification =
                        await db.collection('users/' + srId + '/notifications')
                            .where("orderId", "==", orderId)
                            .where("open", "==", true)
                            .get()

                    snapNotification.forEach(
                        (doc) => {
                            idNotification = doc.data().notificationId
                        }
                    )

                    updateDocumentNotification(srId, notificationDataAtasan, 'Success: update notification SR').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ssgaId, notificationDataAtasan, 'Success: update notification SSGA').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(rsdId, notificationDataAtasan, 'Success: update notification RSD').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ohId, notificationDataAtasan, 'Success: update notification OH').then(() => console.log('success')).catch((error) => console.log(error))
                    updateDocumentNotification(pnId, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId2, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId3, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))

                    //notifikasi atasan
                    const docPN = await db.collection('users').doc(pnId).get()
                    const dtPN = docPN.data()
                    let registrationTokenPN, userTypePN
                    if (dtPN !== undefined) {
                        registrationTokenPN = dtPN.token
                        userTypePN = dtPN.type
                    }
                    const docPN2 = await db.collection('users').doc(pnId2).get()
                    const dtPN2 = docPN2.data()
                    let registrationTokenPN2, userTypePN2
                    if (dtPN2 !== undefined) {
                        registrationTokenPN2 = dtPN2.token
                        userTypePN2 = dtPN2.type
                    }
                    const docPN3 = await db.collection('users').doc(pnId3).get()
                    const dtPN3 = docPN3.data()
                    let registrationTokenPN3, userTypePN3
                    if (dtPN3 !== undefined) {
                        registrationTokenPN3 = dtPN3.token
                        userTypePN3 = dtPN3.type
                    }
                    const docOH = await db.collection('users').doc(ohId).get()
                    const dtOH = docOH.data()
                    let registrationTokenOH, userTypeOH
                    if (dtOH !== undefined) {
                        registrationTokenOH = dtOH.token
                        userTypeOH = dtOH.type
                    }
                    const docRSD = await db.collection('users').doc(rsdId).get()
                    const dtRSD = docRSD.data()
                    let registrationTokenRSD, userTypeRSD
                    if (dtRSD !== undefined) {
                        registrationTokenRSD = dtRSD.token
                        userTypeRSD = dtRSD.type
                    }
                    const docSSGA = await db.collection('users').doc(ssgaId).get()
                    const dtSSGA = docSSGA.data()
                    let registrationTokenSSGA, userTypeSSGA
                    if (dtSSGA !== undefined) {
                        registrationTokenSSGA = dtSSGA.token
                        userTypeSSGA = dtSSGA.type
                    }
                    const docSR = await db.collection('users').doc(srId).get()
                    const dtSR = docSR.data()
                    let registrationTokenSR, userTypeSR
                    if (dtSR !== undefined) {
                        registrationTokenSR = dtSR.token
                        userTypeSR = dtSR.type
                    }

                    title = "Permintaan SPBU " + String(nameUser).toUpperCase() + " ditolak"
                    body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " ditolak oleh SSGA"
                    const messagePN = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN
                        },
                        token: registrationTokenPN
                    }
                    const messagePN2 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN2
                        },
                        token: registrationTokenPN2
                    }
                    const messagePN3 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN3
                        },
                        token: registrationTokenPN3
                    }
                    const messageOH = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeOH
                        },
                        token: registrationTokenOH
                    }
                    const messageRSD = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeRSD
                        },
                        token: registrationTokenRSD
                    }
                    const messageSSGA = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSSGA
                        },
                        token: registrationTokenSSGA
                    }
                    const messageSR = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSR
                        },
                        token: registrationTokenSR
                    }

                    sendNotification(messageSR)
                    sendNotification(messageSSGA)
                    sendNotification(messageRSD)
                    sendNotification(messageOH)
                    sendNotification(messagePN)
                    sendNotification(messagePN2)
                    sendNotification(messagePN3)
                    sendNotification(messageUser)
                }

                //tolak OH
                else if (n_confirmOH === false && n_confirmPN === false && n_confirmSR === true && n_confirmSSGA === false) {
                    console.log('TOLAK OH')

                    //buat dokumen notification
                    const notifications = await db.collection('users/' + userId + '/notifications').doc()
                    const notificationId = notifications.id
                    let body = "Mohon maaf, permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " yang diajukan tidak disetujui oleh TBBM Malang"

                    const notificationData = {
                        notificationId,
                        createdOn,
                        title,
                        body,
                        open,
                        type
                    }

                    updateDocumentNotification(userId, notificationData, 'Success: update notification user').then(() => console.log('success ' + notificationId)).catch((error) => console.log(error))

                    //notifikasi
                    const messageUser = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userType
                        },
                        token: registrationTokenUser
                    }

                    //buat dokumen notification
                    title = "SPBU " + String(nameUser).toUpperCase() + " (TOLAK)"
                    body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " ditolak oleh OH" + stringSO

                    const notificationDataAtasan = {
                        createdOn,
                        title,
                        body,
                        open
                    }

                    const snapNotification =
                        await db.collection('users/' + srId + '/notifications')
                            .where("orderId", "==", orderId)
                            .where("open", "==", true)
                            .get()

                    snapNotification.forEach(
                        (doc) => {
                            idNotification = doc.data().notificationId
                        }
                    )

                    updateDocumentNotification(srId, notificationDataAtasan, 'Success: update notification SR').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ssgaId, notificationDataAtasan, 'Success: update notification SSGA').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(rsdId, notificationDataAtasan, 'Success: update notification RSD').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ohId, notificationDataAtasan, 'Success: update notification OH').then(() => console.log('success')).catch((error) => console.log(error))
                    updateDocumentNotification(pnId, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId2, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId3, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))

                    //notifikasi atasan
                    const docPN = await db.collection('users').doc(pnId).get()
                    const dtPN = docPN.data()
                    let registrationTokenPN, userTypePN
                    if (dtPN !== undefined) {
                        registrationTokenPN = dtPN.token
                        userTypePN = dtPN.type
                    }
                    const docPN2 = await db.collection('users').doc(pnId2).get()
                    const dtPN2 = docPN2.data()
                    let registrationTokenPN2, userTypePN2
                    if (dtPN2 !== undefined) {
                        registrationTokenPN2 = dtPN2.token
                        userTypePN2 = dtPN2.type
                    }
                    const docPN3 = await db.collection('users').doc(pnId3).get()
                    const dtPN3 = docPN3.data()
                    let registrationTokenPN3, userTypePN3
                    if (dtPN3 !== undefined) {
                        registrationTokenPN3 = dtPN3.token
                        userTypePN3 = dtPN3.type
                    }
                    const docOH = await db.collection('users').doc(ohId).get()
                    const dtOH = docOH.data()
                    let registrationTokenOH, userTypeOH
                    if (dtOH !== undefined) {
                        registrationTokenOH = dtOH.token
                        userTypeOH = dtOH.type
                    }
                    const docRSD = await db.collection('users').doc(rsdId).get()
                    const dtRSD = docRSD.data()
                    let registrationTokenRSD, userTypeRSD
                    if (dtRSD !== undefined) {
                        registrationTokenRSD = dtRSD.token
                        userTypeRSD = dtRSD.type
                    }
                    const docSSGA = await db.collection('users').doc(ssgaId).get()
                    const dtSSGA = docSSGA.data()
                    let registrationTokenSSGA, userTypeSSGA
                    if (dtSSGA !== undefined) {
                        registrationTokenSSGA = dtSSGA.token
                        userTypeSSGA = dtSSGA.type
                    }
                    const docSR = await db.collection('users').doc(srId).get()
                    const dtSR = docSR.data()
                    let registrationTokenSR, userTypeSR
                    if (dtSR !== undefined) {
                        registrationTokenSR = dtSR.token
                        userTypeSR = dtSR.type
                    }

                    title = "Permintaan SPBU " + String(nameUser).toUpperCase() + " ditolak"
                    body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " ditolak oleh OH"
                    const messagePN = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN
                        },
                        token: registrationTokenPN
                    }
                    const messagePN2 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN2
                        },
                        token: registrationTokenPN2
                    }
                    const messagePN3 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN3
                        },
                        token: registrationTokenPN3
                    }
                    const messageOH = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeOH
                        },
                        token: registrationTokenOH
                    }
                    const messageRSD = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeRSD
                        },
                        token: registrationTokenRSD
                    }
                    const messageSSGA = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSSGA
                        },
                        token: registrationTokenSSGA
                    }
                    const messageSR = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSR
                        },
                        token: registrationTokenSR
                    }

                    sendNotification(messageSR)
                    sendNotification(messageSSGA)
                    sendNotification(messageRSD)
                    sendNotification(messageOH)
                    sendNotification(messagePN)
                    sendNotification(messagePN2)
                    sendNotification(messagePN3)
                    sendNotification(messageUser)
                }

                //tolak PN
                else if (n_confirmOH === true && n_confirmPN === false && n_confirmSR === true && n_confirmSSGA === true) {
                    console.log('TOLAK PN')

                    //buat dokumen notification
                    const notifications = await db.collection('users/' + userId + '/notifications').doc()
                    const notificationId = notifications.id
                    let body = "Mohon maaf, permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " yang diajukan tidak disetujui oleh TBBM Malang"

                    const notificationData = {
                        notificationId,
                        createdOn,
                        title,
                        body,
                        open,
                        type
                    }

                    updateDocumentNotification(userId, notificationData, 'Success: update notification user').then(() => console.log('success ' + notificationId)).catch((error) => console.log(error))

                    //notifikasi
                    const messageUser = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userType
                        },
                        token: registrationTokenUser
                    }

                    //buat dokumen notification
                    title = "SPBU " + String(nameUser).toUpperCase() + " (TOLAK)"
                    body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " ditolak oleh PN" + stringSO

                    const notificationDataAtasan = {
                        createdOn,
                        title,
                        body,
                        open
                    }

                    const snapNotification =
                        await db.collection('users/' + srId + '/notifications')
                            .where("orderId", "==", orderId)
                            .where("open", "==", true)
                            .get()

                    snapNotification.forEach(
                        (doc) => {
                            idNotification = doc.data().notificationId
                        }
                    )

                    updateDocumentNotification(srId, notificationDataAtasan, 'Success: update notification SR').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ssgaId, notificationDataAtasan, 'Success: update notification SSGA').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(rsdId, notificationDataAtasan, 'Success: update notification RSD').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ohId, notificationDataAtasan, 'Success: update notification OH').then(() => console.log('success')).catch((error) => console.log(error))
                    updateDocumentNotification(pnId, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId2, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId3, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))

                    //notifikasi atasan
                    const docPN = await db.collection('users').doc(pnId).get()
                    const dtPN = docPN.data()
                    let registrationTokenPN, userTypePN
                    if (dtPN !== undefined) {
                        registrationTokenPN = dtPN.token
                        userTypePN = dtPN.type
                    }
                    const docPN2 = await db.collection('users').doc(pnId2).get()
                    const dtPN2 = docPN2.data()
                    let registrationTokenPN2, userTypePN2
                    if (dtPN2 !== undefined) {
                        registrationTokenPN2 = dtPN2.token
                        userTypePN2 = dtPN2.type
                    }
                    const docPN3 = await db.collection('users').doc(pnId3).get()
                    const dtPN3 = docPN3.data()
                    let registrationTokenPN3, userTypePN3
                    if (dtPN3 !== undefined) {
                        registrationTokenPN3 = dtPN3.token
                        userTypePN3 = dtPN3.type
                    }
                    const docOH = await db.collection('users').doc(ohId).get()
                    const dtOH = docOH.data()
                    let registrationTokenOH, userTypeOH
                    if (dtOH !== undefined) {
                        registrationTokenOH = dtOH.token
                        userTypeOH = dtOH.type
                    }
                    const docRSD = await db.collection('users').doc(rsdId).get()
                    const dtRSD = docRSD.data()
                    let registrationTokenRSD, userTypeRSD
                    if (dtRSD !== undefined) {
                        registrationTokenRSD = dtRSD.token
                        userTypeRSD = dtRSD.type
                    }
                    const docSSGA = await db.collection('users').doc(ssgaId).get()
                    const dtSSGA = docSSGA.data()
                    let registrationTokenSSGA, userTypeSSGA
                    if (dtSSGA !== undefined) {
                        registrationTokenSSGA = dtSSGA.token
                        userTypeSSGA = dtSSGA.type
                    }
                    const docSR = await db.collection('users').doc(srId).get()
                    const dtSR = docSR.data()
                    let registrationTokenSR, userTypeSR
                    if (dtSR !== undefined) {
                        registrationTokenSR = dtSR.token
                        userTypeSR = dtSR.type
                    }

                    title = "Permintaan SPBU " + String(nameUser).toUpperCase() + " ditolak"
                    body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " ditolak oleh PN"
                    const messagePN = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN
                        },
                        token: registrationTokenPN
                    }
                    const messagePN2 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN2
                        },
                        token: registrationTokenPN2
                    }
                    const messagePN3 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN3
                        },
                        token: registrationTokenPN3
                    }
                    const messageOH = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeOH
                        },
                        token: registrationTokenOH
                    }
                    const messageRSD = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeRSD
                        },
                        token: registrationTokenRSD
                    }
                    const messageSSGA = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSSGA
                        },
                        token: registrationTokenSSGA
                    }
                    const messageSR = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSR
                        },
                        token: registrationTokenSR
                    }

                    sendNotification(messageSR)
                    sendNotification(messageSSGA)
                    sendNotification(messageRSD)
                    sendNotification(messageOH)
                    sendNotification(messagePN)
                    sendNotification(messagePN2)
                    sendNotification(messagePN3)
                    sendNotification(messageUser)
                }

                else {
                    console.log('TOLAK (ERROR)')
                }
            }

            //acc PN
            else if (n_confirmPN !== p_confirmPN) {
                if (n_confirmOH === true && n_confirmPN === true && n_confirmSR === true && n_confirmSSGA === true) {
                    console.log('ACC PN')

                    //buat dokumen notification
                    const notifications = await db.collection('users/' + userId + '/notifications').doc()
                    const notificationId = notifications.id
                    let title = "Permintaan Disetujui"
                    let body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " yang diajukan telah disetujui oleh TBBM Malang dan akan segera diproses"
                    const open = false
                    const createdOn = admin.firestore.Timestamp.now()

                    const notificationData = {
                        notificationId,
                        createdOn,
                        title,
                        body,
                        open,
                        type
                    }

                    updateDocumentNotification(userId, notificationData, 'Success: update notification user').then(() => console.log('success ' + notificationId)).catch((error) => console.log(error))

                    //notifikasi
                    const messageUser = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userType
                        },
                        token: registrationTokenUser
                    }

                    //buat dokumen notification
                    title = "SPBU " + String(nameUser).toUpperCase() + " (ACC)"
                    body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " telah disetujui, harap segera diproses" + stringSO

                    const notificationDataAtasan = {
                        createdOn,
                        title,
                        body,
                        open
                    }

                    const snapNotification =
                        await db.collection('users/' + srId + '/notifications')
                            .where("orderId", "==", orderId)
                            .where("open", "==", true)
                            .get()

                    snapNotification.forEach(
                        (doc) => {
                            idNotification = doc.data().notificationId
                        }
                    )

                    updateDocumentNotification(srId, notificationDataAtasan, 'Success: update notification SR').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ssgaId, notificationDataAtasan, 'Success: update notification SSGA').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(rsdId, notificationDataAtasan, 'Success: update notification RSD').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ohId, notificationDataAtasan, 'Success: update notification OH').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId2, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId3, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))

                    //notifikasi atasan
                    const docPN = await db.collection('users').doc(pnId).get()
                    const dtPN = docPN.data()
                    let registrationTokenPN, userTypePN
                    if (dtPN !== undefined) {
                        registrationTokenPN = dtPN.token
                        userTypePN = dtPN.type
                    }
                    const docPN2 = await db.collection('users').doc(pnId2).get()
                    const dtPN2 = docPN2.data()
                    let registrationTokenPN2, userTypePN2
                    if (dtPN2 !== undefined) {
                        registrationTokenPN2 = dtPN2.token
                        userTypePN2 = dtPN2.type
                    }
                    const docPN3 = await db.collection('users').doc(pnId3).get()
                    const dtPN3 = docPN3.data()
                    let registrationTokenPN3, userTypePN3
                    if (dtPN3 !== undefined) {
                        registrationTokenPN3 = dtPN3.token
                        userTypePN3 = dtPN3.type
                    }
                    const docOH = await db.collection('users').doc(ohId).get()
                    const dtOH = docOH.data()
                    let registrationTokenOH, userTypeOH
                    if (dtOH !== undefined) {
                        registrationTokenOH = dtOH.token
                        userTypeOH = dtOH.type
                    }
                    const docRSD = await db.collection('users').doc(rsdId).get()
                    const dtRSD = docRSD.data()
                    let registrationTokenRSD, userTypeRSD
                    if (dtRSD !== undefined) {
                        registrationTokenRSD = dtRSD.token
                        userTypeRSD = dtRSD.type
                    }
                    const docSSGA = await db.collection('users').doc(ssgaId).get()
                    const dtSSGA = docSSGA.data()
                    let registrationTokenSSGA, userTypeSSGA
                    if (dtSSGA !== undefined) {
                        registrationTokenSSGA = dtSSGA.token
                        userTypeSSGA = dtSSGA.type
                    }
                    const docSR = await db.collection('users').doc(srId).get()
                    const dtSR = docSR.data()
                    let registrationTokenSR, userTypeSR
                    if (dtSR !== undefined) {
                        registrationTokenSR = dtSR.token
                        userTypeSR = dtSR.type
                    }

                    title = "Permintaan SPBU " + String(nameUser).toUpperCase() + " disetujui"
                    body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " telah disetujui oleh PN"
                    const messagePN = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN
                        },
                        token: registrationTokenPN
                    }
                    const messagePN2 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN2
                        },
                        token: registrationTokenPN2
                    }
                    const messagePN3 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN3
                        },
                        token: registrationTokenPN3
                    }
                    const messageOH = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeOH
                        },
                        token: registrationTokenOH
                    }
                    const messageRSD = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeRSD
                        },
                        token: registrationTokenRSD
                    }
                    const messageSSGA = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSSGA
                        },
                        token: registrationTokenSSGA
                    }
                    const messageSR = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSR
                        },
                        token: registrationTokenSR
                    }

                    sendNotification(messageSR)
                    sendNotification(messageSSGA)
                    sendNotification(messageRSD)
                    sendNotification(messageOH)
                    sendNotification(messagePN)
                    sendNotification(messagePN2)
                    sendNotification(messagePN3)
                    sendNotification(messageUser)
                }
            }

            //acc OH
            else if (n_confirmOH !== p_confirmOH) {
                if (n_confirmOH === true && n_confirmPN === false && n_confirmSR === true && n_confirmSSGA === false) {
                    console.log('ACC OH')

                    //buat dokumen notification
                    const status = "\nMenunggu konfirmasi dari SSGA"
                    let body = "Terdapat permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + stringSO + status
                    const createdOn = admin.firestore.Timestamp.now()

                    const notificationDataAtasan = {
                        createdOn,
                        body
                    }

                    const snapNotification =
                        await db.collection('users/' + srId + '/notifications')
                            .where("orderId", "==", orderId)
                            .where("open", "==", true)
                            .get()

                    snapNotification.forEach(
                        (doc) => {
                            idNotification = doc.data().notificationId
                        }
                    )

                    updateDocumentNotification(srId, notificationDataAtasan, 'Success: update notification SR').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ssgaId, notificationDataAtasan, 'Success: update notification SSGA').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(rsdId, notificationDataAtasan, 'Success: update notification RSD').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ohId, notificationDataAtasan, 'Success: update notification OH').then(() => console.log('success')).catch((error) => console.log(error))
                    updateDocumentNotification(pnId, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId2, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId3, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))

                    //notifikasi atasan
                    const docPN = await db.collection('users').doc(pnId).get()
                    const dtPN = docPN.data()
                    let registrationTokenPN, userTypePN
                    if (dtPN !== undefined) {
                        registrationTokenPN = dtPN.token
                        userTypePN = dtPN.type
                    }
                    const docPN2 = await db.collection('users').doc(pnId2).get()
                    const dtPN2 = docPN2.data()
                    let registrationTokenPN2, userTypePN2
                    if (dtPN2 !== undefined) {
                        registrationTokenPN2 = dtPN2.token
                        userTypePN2 = dtPN2.type
                    }
                    const docPN3 = await db.collection('users').doc(pnId3).get()
                    const dtPN3 = docPN3.data()
                    let registrationTokenPN3, userTypePN3
                    if (dtPN3 !== undefined) {
                        registrationTokenPN3 = dtPN3.token
                        userTypePN3 = dtPN3.type
                    }
                    const docOH = await db.collection('users').doc(ohId).get()
                    const dtOH = docOH.data()
                    let registrationTokenOH, userTypeOH
                    if (dtOH !== undefined) {
                        registrationTokenOH = dtOH.token
                        userTypeOH = dtOH.type
                    }
                    const docRSD = await db.collection('users').doc(rsdId).get()
                    const dtRSD = docRSD.data()
                    let registrationTokenRSD, userTypeRSD
                    if (dtRSD !== undefined) {
                        registrationTokenRSD = dtRSD.token
                        userTypeRSD = dtRSD.type
                    }
                    const docSSGA = await db.collection('users').doc(ssgaId).get()
                    const dtSSGA = docSSGA.data()
                    let registrationTokenSSGA, userTypeSSGA
                    if (dtSSGA !== undefined) {
                        registrationTokenSSGA = dtSSGA.token
                        userTypeSSGA = dtSSGA.type
                    }
                    const docSR = await db.collection('users').doc(srId).get()
                    const dtSR = docSR.data()
                    let registrationTokenSR, userTypeSR
                    if (dtSR !== undefined) {
                        registrationTokenSR = dtSR.token
                        userTypeSR = dtSR.type
                    }

                    const title = "Permintaan SPBU " + String(nameUser).toUpperCase() + " disetujui"
                    body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " telah disetujui oleh OH"
                    const messagePN = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN
                        },
                        token: registrationTokenPN
                    }
                    const messagePN2 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN2
                        },
                        token: registrationTokenPN2
                    }
                    const messagePN3 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN3
                        },
                        token: registrationTokenPN3
                    }
                    const messageOH = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeOH
                        },
                        token: registrationTokenOH
                    }
                    const messageRSD = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeRSD
                        },
                        token: registrationTokenRSD
                    }
                    const messageSSGA = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSSGA
                        },
                        token: registrationTokenSSGA
                    }
                    const messageSR = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSR
                        },
                        token: registrationTokenSR
                    }

                    sendNotification(messageSR)
                    sendNotification(messageSSGA)
                    sendNotification(messageRSD)
                    sendNotification(messageOH)
                    sendNotification(messagePN)
                    sendNotification(messagePN2)
                    sendNotification(messagePN3)
                }
            }

            //acc SSGA
            else if (n_confirmSSGA !== p_confirmSSGA) {
                if (n_confirmOH === true && n_confirmPN === false && n_confirmSR === true && n_confirmSSGA === true) {
                    console.log('ACC SSGA')

                    //buat dokumen notification
                    const status = "\nMenunggu konfirmasi dari PN"
                    let body = "Terdapat permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + stringSO + status
                    const createdOn = admin.firestore.Timestamp.now()

                    const notificationDataAtasan = {
                        createdOn,
                        body
                    }

                    const snapNotification =
                        await db.collection('users/' + srId + '/notifications')
                            .where("orderId", "==", orderId)
                            .where("open", "==", true)
                            .get()

                    snapNotification.forEach(
                        (doc) => {
                            idNotification = doc.data().notificationId
                        }
                    )

                    updateDocumentNotification(srId, notificationDataAtasan, 'Success: update notification SR').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ssgaId, notificationDataAtasan, 'Success: update notification SSGA').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(rsdId, notificationDataAtasan, 'Success: update notification RSD').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ohId, notificationDataAtasan, 'Success: update notification OH').then(() => console.log('success')).catch((error) => console.log(error))
                    updateDocumentNotification(pnId, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId2, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId3, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))

                    //notifikasi atasan
                    const docPN = await db.collection('users').doc(pnId).get()
                    const dtPN = docPN.data()
                    let registrationTokenPN, userTypePN
                    if (dtPN !== undefined) {
                        registrationTokenPN = dtPN.token
                        userTypePN = dtPN.type
                    }
                    const docPN2 = await db.collection('users').doc(pnId2).get()
                    const dtPN2 = docPN2.data()
                    let registrationTokenPN2, userTypePN2
                    if (dtPN2 !== undefined) {
                        registrationTokenPN2 = dtPN2.token
                        userTypePN2 = dtPN2.type
                    }
                    const docPN3 = await db.collection('users').doc(pnId3).get()
                    const dtPN3 = docPN3.data()
                    let registrationTokenPN3, userTypePN3
                    if (dtPN3 !== undefined) {
                        registrationTokenPN3 = dtPN3.token
                        userTypePN3 = dtPN3.type
                    }
                    const docOH = await db.collection('users').doc(ohId).get()
                    const dtOH = docOH.data()
                    let registrationTokenOH, userTypeOH
                    if (dtOH !== undefined) {
                        registrationTokenOH = dtOH.token
                        userTypeOH = dtOH.type
                    }
                    const docRSD = await db.collection('users').doc(rsdId).get()
                    const dtRSD = docRSD.data()
                    let registrationTokenRSD, userTypeRSD
                    if (dtRSD !== undefined) {
                        registrationTokenRSD = dtRSD.token
                        userTypeRSD = dtRSD.type
                    }
                    const docSSGA = await db.collection('users').doc(ssgaId).get()
                    const dtSSGA = docSSGA.data()
                    let registrationTokenSSGA, userTypeSSGA
                    if (dtSSGA !== undefined) {
                        registrationTokenSSGA = dtSSGA.token
                        userTypeSSGA = dtSSGA.type
                    }
                    const docSR = await db.collection('users').doc(srId).get()
                    const dtSR = docSR.data()
                    let registrationTokenSR, userTypeSR
                    if (dtSR !== undefined) {
                        registrationTokenSR = dtSR.token
                        userTypeSR = dtSR.type
                    }

                    const title = "Permintaan SPBU " + String(nameUser).toUpperCase() + " disetujui"
                    body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " telah disetujui oleh SSGA"
                    const messagePN = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN
                        },
                        token: registrationTokenPN
                    }
                    const messagePN2 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN2
                        },
                        token: registrationTokenPN2
                    }
                    const messagePN3 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN3
                        },
                        token: registrationTokenPN3
                    }
                    const messageOH = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeOH
                        },
                        token: registrationTokenOH
                    }
                    const messageRSD = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeRSD
                        },
                        token: registrationTokenRSD
                    }
                    const messageSSGA = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSSGA
                        },
                        token: registrationTokenSSGA
                    }
                    const messageSR = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSR
                        },
                        token: registrationTokenSR
                    }

                    sendNotification(messageSR)
                    sendNotification(messageSSGA)
                    sendNotification(messageRSD)
                    sendNotification(messageOH)
                    sendNotification(messagePN)
                    sendNotification(messagePN2)
                    sendNotification(messagePN3)
                }
            }

            //acc SR
            else if (n_confirmSR !== p_confirmSR) {
                if (n_confirmOH === false && n_confirmPN === false && n_confirmSR === true && n_confirmSSGA === false) {
                    console.log('ACC SR')

                    //buat dokumen notification
                    const status = "\nMenunggu konfirmasi dari OH"
                    let body = "Terdapat permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + stringSO + status
                    const createdOn = admin.firestore.Timestamp.now()

                    const notificationDataAtasan = {
                        createdOn,
                        body
                    }

                    const snapNotification =
                        await db.collection('users/' + srId + '/notifications')
                            .where("orderId", "==", orderId)
                            .where("open", "==", true)
                            .get()

                    snapNotification.forEach(
                        (doc) => {
                            idNotification = doc.data().notificationId
                        }
                    )

                    updateDocumentNotification(srId, notificationDataAtasan, 'Success: update notification SR').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ssgaId, notificationDataAtasan, 'Success: update notification SSGA').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(rsdId, notificationDataAtasan, 'Success: update notification RSD').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(ohId, notificationDataAtasan, 'Success: update notification OH').then(() => console.log('success')).catch((error) => console.log(error))
                    updateDocumentNotification(pnId, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId2, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))
                    updateDocumentNotification(pnId3, notificationDataAtasan, 'Success: update notification PN').then(() => console.log('success ' + idNotification)).catch((error) => console.log(error))

                    //notifikasi atasan
                    const docPN = await db.collection('users').doc(pnId).get()
                    const dtPN = docPN.data()
                    let registrationTokenPN, userTypePN
                    if (dtPN !== undefined) {
                        registrationTokenPN = dtPN.token
                        userTypePN = dtPN.type
                    }
                    const docPN2 = await db.collection('users').doc(pnId2).get()
                    const dtPN2 = docPN2.data()
                    let registrationTokenPN2, userTypePN2
                    if (dtPN2 !== undefined) {
                        registrationTokenPN2 = dtPN2.token
                        userTypePN2 = dtPN2.type
                    }
                    const docPN3 = await db.collection('users').doc(pnId3).get()
                    const dtPN3 = docPN3.data()
                    let registrationTokenPN3, userTypePN3
                    if (dtPN3 !== undefined) {
                        registrationTokenPN3 = dtPN3.token
                        userTypePN3 = dtPN3.type
                    }
                    const docOH = await db.collection('users').doc(ohId).get()
                    const dtOH = docOH.data()
                    let registrationTokenOH, userTypeOH
                    if (dtOH !== undefined) {
                        registrationTokenOH = dtOH.token
                        userTypeOH = dtOH.type
                    }
                    const docRSD = await db.collection('users').doc(rsdId).get()
                    const dtRSD = docRSD.data()
                    let registrationTokenRSD, userTypeRSD
                    if (dtRSD !== undefined) {
                        registrationTokenRSD = dtRSD.token
                        userTypeRSD = dtRSD.type
                    }
                    const docSSGA = await db.collection('users').doc(ssgaId).get()
                    const dtSSGA = docSSGA.data()
                    let registrationTokenSSGA, userTypeSSGA
                    if (dtSSGA !== undefined) {
                        registrationTokenSSGA = dtSSGA.token
                        userTypeSSGA = dtSSGA.type
                    }
                    const docSR = await db.collection('users').doc(srId).get()
                    const dtSR = docSR.data()
                    let registrationTokenSR, userTypeSR
                    if (dtSR !== undefined) {
                        registrationTokenSR = dtSR.token
                        userTypeSR = dtSR.type
                    }

                    const title = "Permintaan SPBU " + String(nameUser).toUpperCase() + " disetujui"
                    body = "Permintaan " + String(type).toUpperCase() + " sejumlah: " + stringVolume + " telah disetujui oleh SR"
                    const messagePN = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN
                        },
                        token: registrationTokenPN
                    }
                    const messagePN2 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN2
                        },
                        token: registrationTokenPN2
                    }
                    const messagePN3 = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypePN3
                        },
                        token: registrationTokenPN3
                    }
                    const messageOH = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeOH
                        },
                        token: registrationTokenOH
                    }
                    const messageRSD = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeRSD
                        },
                        token: registrationTokenRSD
                    }
                    const messageSSGA = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSSGA
                        },
                        token: registrationTokenSSGA
                    }
                    const messageSR = {
                        data: {
                            "title": title,
                            "body": body,
                            "type": type,
                            "userType": userTypeSR
                        },
                        token: registrationTokenSR
                    }

                    sendNotification(messageSR)
                    sendNotification(messageSSGA)
                    sendNotification(messageRSD)
                    sendNotification(messageOH)
                    sendNotification(messagePN)
                    sendNotification(messagePN2)
                    sendNotification(messagePN3)
                }
            }

            else {
                console.log("Trigger update nothing")
            }

        } catch (error) {
            console.log(error)
        }
    })

//trigger update user
exports.onUpdateUser = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        try {
            const newValue = change.after.data()
            const previousValue = change.before.data()

            const n_registrationTokens: any[] = []
            const p_registrationTokens: any[] = []

            let n_token, p_token, n_type, topic

            //mendapatkan nilai seluruh field sesudah diupdate
            if (newValue !== undefined) {
                n_token = newValue.token
                n_registrationTokens.push(n_token)
                n_type = newValue.type
            }

            //mendapatkan nilai seluruh field sebelum diupdate
            if (previousValue !== undefined) {
                p_token = previousValue.token
                p_registrationTokens.push(p_token)
            }

            if (n_token !== p_token && n_token === '') {
                if (n_type === 'spbu') {
                    topic = 'quiz'
                    unsubscribeNotification(p_registrationTokens, topic)
                } else {
                    //
                }
                topic = 'information'
                unsubscribeNotification(p_registrationTokens, topic)
                topic = 'education'
                unsubscribeNotification(p_registrationTokens, topic)

            } else if (n_token !== p_token && n_token !== '') {
                if (n_type === 'spbu') {
                    topic = 'quiz'
                    subscribeNotification(p_registrationTokens, topic)
                } else {
                    //
                }
                topic = 'information'
                subscribeNotification(n_registrationTokens, topic)
                topic = 'education'
                subscribeNotification(n_registrationTokens, topic)
            } else {
                console.log('update user')
            }
        } catch (error) {
            console.log(error)
        }
    })

//trigger create quiz
exports.onCreateQuiz = functions.firestore
    .document('quiz/{quizId}')
    .onCreate(async (change, context) => {
        try {
            const topic = 'quiz'
            const title = 'Quiz Baru'
            const type = 'quiz'
            const body = 'Terdapat quiz yang baru ditambahkan'

            const message = {
                data: {
                    "title": title,
                    "body": body,
                    "type": type
                },
                topic: topic
            }
            sendNotification(message)

        } catch (error) {
            console.log(error)
        }
    })

//trigger update quiz
exports.onUpdateQuiz = functions.firestore
    .document('quiz/{quizId}')
    .onUpdate(async (change, context) => {
        try {
            const newValue = change.after.data()
            const previousValue = change.before.data()

            let n_open, p_open, n_complete

            //mendapatkan nilai seluruh field sesudah diupdate
            if (newValue !== undefined) {
                n_open = newValue.open
                n_complete = newValue.complete
            }

            //mendapatkan nilai seluruh field sebelum diupdate
            if (previousValue !== undefined) {
                p_open = previousValue.open
            }

            if (n_open !== p_open && n_open === true && n_complete === false) {
                const title = 'Quiz dibuka'
                const body = 'Terdapat quiz yang baru dibuka, ayo segera dikerjakan'
                const topic = 'quiz'
                const type = 'quiz'

                const message = {
                    data: {
                        "title": title,
                        "body": body,
                        "type": type
                    },
                    topic: topic
                }

                sendNotification(message)

            } else if (n_open !== p_open && n_open === false && n_complete === true) {
                const title = 'Quiz ditutup'
                const body = 'Terima kasih atas partisipasinya, mohon menunggu hasilnya'
                const topic = 'quiz'
                const type = 'quiz'

                const message = {
                    data: {
                        "title": title,
                        "body": body,
                        "type": type
                    },
                    topic: topic
                }

                sendNotification(message)
            }
        } catch (error) {
            console.log(error)
        }
    })

//trigger create information
exports.onCreateInformation = functions.firestore
    .document('informations/{informationId}')
    .onCreate(async (snapshot, context) => {
        try {
            const topic = 'information'
            const type = 'education'
            const title = 'Informasi Baru'
            const body = 'Terdapat informasi yang baru ditambahkan'

            const message = {
                data: {
                    "title": title,
                    "body": body,
                    "type": type
                },
                topic: topic
            }
            sendNotification(message)

        } catch (error) {
            console.log(error)
        }
    })

//trigger create education
exports.onCreateEducation = functions.firestore
    .document('educations/{educationId}/documents/{documentId}')
    .onCreate(async (snapshot, context) => {
        try {
            const educationId = context.params.educationId
            const documentId = context.params.documentId

            const educations = await db.collection('educations').doc(educationId).get()
            const dataEducation = educations.data()
            let titleEducation
            if (dataEducation !== undefined) {
                titleEducation = dataEducation.title
            }

            const documents = await db.collection('educations/' + educationId + '/documents').doc(documentId).get()
            const dataFile = documents.data()
            let caption
            if (dataFile !== undefined) {
                caption = dataFile.caption
            }

            const topic = 'education'
            const type = 'education'
            const title = 'Edukasi Baru'
            const body = '\"' + caption + '\"' + ' telah ditambahkan dalam kategori ' + titleEducation

            const message = {
                data: {
                    "title": title,
                    "body": body,
                    "type": type
                },
                topic: topic
            }
            sendNotification(message)

        } catch (error) {
            console.log(error)
        }
    })

app.get('/subscribe', async (request, response) => {
    try {
        const users = await db.collection('users').get()
        const tokens: any[] = []
        const tokensSpbu: any[] = []
        let data
        users.forEach(
            (doc) => {
                data = doc.data()
                if (data.token === '') {
                    //
                } else {
                    if (data.type === 'spbu') {
                        tokensSpbu.push(data.token)
                    } else {
                        //
                    }
                    tokens.push(data.token)
                }
            }
        )

        const registrationTokens = tokens
        let topic = 'information'
        subscribeNotification(registrationTokens, topic)

        topic = 'education'
        subscribeNotification(registrationTokens, topic)

        response.json(registrationTokens)

    } catch (error) {
        response.status(500).send(error)
    }
})

function sendNotification(message: any): void {
    admin.messaging().send(message)
        .then((response) => {
            console.log('Successfully sent message:', response)
        })
        .catch((error) => {
            console.log('Error sending message:', error)
        })
}

function subscribeNotification(registrationTokens: any[], topic: string): void {
    admin.messaging().subscribeToTopic(registrationTokens, topic)
        .then(function (response) {
            console.log('Successfully subscribed to topic: ' + topic, response)
        })
        .catch(function (error) {
            console.log('Error subscribing to topic: ' + topic, error)
        })
}

function unsubscribeNotification(registrationTokens: any[], topic: string): void {
    admin.messaging().unsubscribeFromTopic(registrationTokens, topic)
        .then(function (response) {
            console.log('Successfully unsubscribed from topic: ' + topic, response)
        })
        .catch(function (error) {
            console.log('Error unsubscribing from topic: ' + topic, error)
        })
}

//function notifikasi all
// async function sendNotificationAll(): Promise<void> {
//     const snapUser = user.data()
//     let nameUser, srId
//     if (snapUser !== undefined) {
//         nameUser = snapUser.name
//         srId = snapUser.salesRetailId
//     }
//     const snapOrder = order.data()
//     let typeOrder
//     if (snapOrder !== undefined) {
//         typeOrder = snapOrder.type
//     }
//     type = typeOrder

//     let new_confirmOH, new_confirmPN, new_confirmSR, new_confirmSSGA
//     if (newValue !== undefined) {
//         new_confirmOH = newValue.orderConfirmation.confirmOH
//         new_confirmPN = newValue.orderConfirmation.confirmPN
//         new_confirmSR = newValue.orderConfirmation.confirmSR
//         new_confirmSSGA = newValue.orderConfirmation.confirmSSGA
//     } else {
//         console.log("Error new value")
//     }

//     let status
//     if (new_confirmPN === false && new_confirmOH === true && new_confirmSSGA === true && new_confirmSR === true) {
//         status = ". Menunggu konfirmasi dari PN"
//     } else if (new_confirmPN === false && new_confirmOH === false && new_confirmSSGA === true && new_confirmSR === true) {
//         status = ". Menunggu konfirmasi dari OH"
//     } else if (new_confirmPN === false && new_confirmOH === false && new_confirmSSGA === false && new_confirmSR === true) {
//         status = ". Menunggu konfirmasi dari SSGA"
//     } else if (new_confirmPN === false && new_confirmOH === true && new_confirmSSGA === false && new_confirmSR === false) {
//         status = ". Menunggu konfirmasi dari SR"
//     } else {
//         // console.log("Nothing")
//     }

//     const title = "Permintaan Baru"
//     const body = "Terdapat permintaan " + String(type).toUpperCase() + " baru dari " + String(nameUser).toUpperCase() + status

//     const docPN = await db.collection('users').doc(pnId).get()
//     const dtPN = docPN.data()
//     let registrationTokenPN
//     if (dtPN !== undefined) {
//         registrationTokenPN = dtPN.token
//     }
//     const docOH = await db.collection('users').doc(ohId).get()
//     const dtOH = docOH.data()
//     let registrationTokenOH
//     if (dtOH !== undefined) {
//         registrationTokenOH = dtOH.token
//     }
//     const docSSGA = await db.collection('users').doc(ssgaId).get()
//     const dtSSGA = docSSGA.data()
//     let registrationTokenSSGA
//     if (dtSSGA !== undefined) {
//         registrationTokenSSGA = dtSSGA.token
//     }
//     const docSR = await db.collection('users').doc(srId).get()
//     const dtSR = docSR.data()
//     let registrationTokenSR
//     if (dtSR !== undefined) {
//         registrationTokenSR = dtSR.token
//     }

//     const messagePN = {
//         data: {
//             "title": title,
//             "body": body,
//             "type": type
//         },
//         token: registrationTokenPN
//     }
//     const messageOH = {
//         data: {
//             "title": title,
//             "body": body,
//             "type": type
//         },
//         token: registrationTokenOH
//     }
//     const messageSSGA = {
//         data: {
//             "title": title,
//             "body": body,
//             "type": type
//         },
//         token: registrationTokenSSGA
//     }
//     const messageSR = {
//         data: {
//             "title": title,
//             "body": body,
//             "type": type
//         },
//         token: registrationTokenSR
//     }

//     admin.messaging().send(messagePN)
//         .then((response) => {
//             console.log('Successfully sent message:', response)
//         })
//         .catch((error) => {
//             console.log('Error sending message:', error)
//         })
//     admin.messaging().send(messageOH)
//         .then((response) => {
//             console.log('Successfully sent message:', response)
//         })
//         .catch((error) => {
//             console.log('Error sending message:', error)
//         })
//     admin.messaging().send(messageSSGA)
//         .then((response) => {
//             console.log('Successfully sent message:', response)
//         })
//         .catch((error) => {
//             console.log('Error sending message:', error)
//         })
//     admin.messaging().send(messageSR)
//         .then((response) => {
//             console.log('Successfully sent message:', response)
//         })
//         .catch((error) => {
//             console.log('Error sending message:', error)
//         })

//     const notificationsPN = await db.collection('users/' + pnId + '/notifications').doc()
//     const notificationIdPN = notificationsPN.id
//     const notificationsOH = await db.collection('users/' + ohId + '/notifications').doc()
//     const notificationIdOH = notificationsOH.id
//     const notificationsSSGA = await db.collection('users/' + ssgaId + '/notifications').doc()
//     const notificationIdSSGA = notificationsSSGA.id
//     const notificationsSR = await db.collection('users/' + srId + '/notifications').doc()
//     const notificationIdSR = notificationsSR.id
//     const open = true
//     const createdOn = admin.firestore.Timestamp.now()

//     let notificationId
//     notificationId = notificationIdPN
//     const notificationDataPN = {
//         notificationId,
//         createdOn,
//         title,
//         body,
//         open,
//         type
//     }
//     notificationId = notificationIdOH
//     const notificationDataOH = {
//         notificationId,
//         createdOn,
//         title,
//         body,
//         open,
//         type
//     }
//     notificationId = notificationIdSSGA
//     const notificationDataSSGA = {
//         notificationId,
//         createdOn,
//         title,
//         body,
//         open,
//         type
//     }
//     notificationId = notificationIdSR
//     const notificationDataSR = {
//         notificationId,
//         createdOn,
//         title,
//         body,
//         open,
//         type
//     }

//     await db.doc('users/' + pnId + "/notifications/" + notificationIdPN).set(notificationDataPN, { merge: true })
//         .then(function () {
//             console.log('Success: create notification PN')
//         })
//         .catch(function (error) {
//             console.log(error)
//         })
//     await db.doc('users/' + ohId + "/notifications/" + notificationIdOH).set(notificationDataOH, { merge: true })
//         .then(function () {
//             console.log('Success: create notification OH')
//         })
//         .catch(function (error) {
//             console.log(error)
//         })
//     await db.doc('users/' + ssgaId + "/notifications/" + notificationIdSSGA).set(notificationDataSSGA, { merge: true })
//         .then(function () {
//             console.log('Success: create notification SSGA')
//         })
//         .catch(function (error) {
//             console.log(error)
//         })
//     await db.doc('users/' + srId + "/notifications/" + notificationIdSR).set(notificationDataSR, { merge: true })
//         .then(function () {
//             console.log('Success: create notification SR')
//         })
//         .catch(function (error) {
//             console.log(error)
//         })
// }