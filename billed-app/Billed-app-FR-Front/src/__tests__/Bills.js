/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import mockedBills from "../__mocks__/store"
import {localStorageMock} from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills"
import router from "../app/Router.js";

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname })
}


// integration test for Bills Display
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("Then it should have a New Bills Button", () => {
      const newBillBtn = screen.getByTestId('btn-new-bill')
      expect(newBillBtn.classList.contains('btn')).toBeTruthy()
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
      window.onNavigate(ROUTES_PATH.Bills)
      const locationEnd = document.location.hash 
      expect(locationEnd).toEqual("#employee/bills")
    })
    describe("And it is loading", () => {
      it("It should display loading message", () => {
        const html = BillsUI({ loading: true })
        document.body.innerHTML = html
        expect(screen.getAllByText('Loading...')).toBeTruthy()
      })
    })
    describe("An Error during the loading", () => {
      test("It should display an error page", () => {
        const html = BillsUI({ error: 'there is an error' })
        document.body.innerHTML = html
        expect(screen.getAllByText('Erreur')).toBeTruthy()
      })
    })
    describe("But an error occured", () => {
      test("It should display error page", () => {
        const html = BillsUI({ error: 'An error occured' })
        document.body.innerHTML = html
        expect(screen.getAllByText('Erreur')).toBeTruthy()
      })
    })
  })
})
describe('When I click on NeW Bill Button', () => {
  it("Should redirect me on add new bill view ", async () => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    // call the same function than a click on NewBill Button 
    window.onNavigate(ROUTES_PATH.NewBill)
    expect(document.location.hash).toEqual("#employee/bill/new")
  })
})

describe('When I click on Icon eyes', () => {
  it("Should open a modal with bills", async () => {
    
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    document.body.innerHTML = BillsUI({ data: bills })
    const iconEyes = document.getElementById('eye')
    userEvent.click(iconEyes);
    expect(screen.findByRole('dialog')).toBeDefined()
  })
})
describe("And there is a bill", () => {
  describe("When I click on eye icon", () =>{
    test("Then the modal should open", ()=>{
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const billToTested = new Bills({document, onNavigate, firestore: null , localStorage: window.localStorage})
      billToTested.handleClickIconEye = jest.fn()
      screen.getAllByTestId('icon-eye')[0].click()
      expect(billToTested.handleClickIconEye).toHaveBeenCalledTimes(1)
    })
    test("Then modal is open with the bill preview", () =>{
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const billToTested = new Bills({document, onNavigate, firestore: null , localStorage: window.localStorage})
      const iconEye = screen.getAllByTestId('icon-eye')[0]
      $.fn.modal = jest.fn()
      billToTested.handleClickIconEye(iconEye)
      expect($.fn.modal).toHaveBeenCalledTimes(1)
      expect(document.querySelector('.modal')).toBeTruthy()
    })
  })
})
// test for GET for getBills 
describe("Given I am a user connected as Employee", () => {
  describe("When I am on bills page", () => {
    test("fetches bills from mock API GET", async () => {
      const spy = jest.spyOn(mockedBills , 'bills')
      const bills = await mockedBills.bills()
      expect(spy).toHaveBeenCalled()
      
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockedBills.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      )
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockedBills.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      )
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message =  screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
