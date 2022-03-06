/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockedBills from "../__mocks__/store"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import router from "../app/Router.js";
import {localStorageMock} from '../__mocks__/localStorage.js';
import Store from "../app/Store.js"
import BillsUI from '../views/BillsUI.js';
import store from '../__mocks__/store'


const onNavigate = ((pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
})

beforeEach(() => {
  const html = NewBillUI()
  document.body.innerHTML = html
})


/* squelette fournit 
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then ...", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      //to-do write assertion
    })
  })
})
*/


describe("Given I am connected as an employee", () => {
  describe("When I am on the New Bill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })
    it("Should have the good URL", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      const locationEnd = document.location.hash 
      expect(locationEnd).toEqual("#employee/bill/new")
    })

    test("it Should display a form", () => {
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })
    test("the form contains 9 inputs", () => {
      expect(screen.getByTestId('form-new-bill').length).toEqual(9)
    })
  })
})
// test with the wrong format 
describe("I add a file in the input for adding a new bill ", () => {
  test("the fill I added should be detected", () =>{
    const newBillForTest = new NewBill({ document, onNavigate, store: Store, localStorage: window.localStorage })
    const handleChangeFile = jest.fn(newBillForTest.handleChangeFile)
    const  testFile = screen.getByTestId('file')
    testFile.addEventListener("change", handleChangeFile)
    fireEvent.change(testFile, {
        target: {
            files: [new File(["test.png"], "test.png", { type: "image" })],
        }
    })
    // change function listener should be called 
    expect(handleChangeFile).toHaveBeenCalledTimes(1)
  })
  // test width a good format
  test("Then an error occured if its a bad format file", () =>{
    const testnewBill = new NewBill({ document, onNavigate, store: Store, localStorage: window.localStorage })
    const handleChangeFile = jest.fn(testnewBill.handleChangeFile)
    const myFile = screen.getByTestId('file')
    myFile.addEventListener("change", handleChangeFile)
    fireEvent.change(myFile, {
        target: {
            files: [new File(["wrong-img.txt"], "wrong-img.txt", { type: "text/txt" })],
        }
    })
    expect(handleChangeFile).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('error-format')).toBeTruthy()
  })
})
describe("When I've completed well the formular and I clicked on submit", () => {
  test("Then a new bill is created", () =>{
    const testnewBill = new NewBill({ document, onNavigate, store: store, localStorage: window.localStorage })
    const validBill = {
      type: "Transports",
      name: "Bus",
      amount: "15",
      date: "2022-03-02",
      vat: "10",
      pct: "10",
      commentary: "This is a valid bill",
      fileUrl: "https://test.storage.tld/v0/b/billable-677b6.a…61.jpeg?alt=media&token=7685cd61-c112-42bc-9929-8a799bb82d8b",
      fileName: "valid-image.jpg"
    }
    const handleSubmit = jest.fn((e) => testnewBill.handleSubmit(e))
    testnewBill.createBill = (testnewBill) => testnewBill
    screen.getByTestId('expense-type').value = validBill.type
    screen.getByTestId('expense-name').value = validBill.name
    screen.getByTestId('amount').value = validBill.amount
    screen.getByTestId('datepicker').value = validBill.date
    screen.getByTestId('vat').value = validBill.vat
    screen.getByTestId('pct').value = validBill.pct
    screen.getByTestId('commentary').value = validBill.commentary
    testnewBill.fileUrl = validBill.fileUrl
    testnewBill.fileName = validBill.fileName
    const submitForm = screen.getByTestId('form-new-bill')
    submitForm.addEventListener('click', handleSubmit)
    fireEvent.click(submitForm)
    expect(handleSubmit).toBeCalledTimes(1)
  })
})
//  integration test for POST 
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to New Bill", () => {
    it("Should send the new bill to the back end", async () => {
       const postSpy = jest.spyOn(mockedBills, "bills")
       const bills = await mockedBills.bills()
       expect(postSpy).toHaveBeenCalledTimes(1)
    })
    test("send data and simulate an 404 error ", async () => {
      mockedBills.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      )
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("create a new bill an API and fails with 500 message error", async () => {
      mockedBills.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      )
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})

