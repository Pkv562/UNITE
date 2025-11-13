"use client"

import React, { useEffect, useState } from "react"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal"
import { Button } from "@heroui/button"
import { Input } from "@heroui/input"
import { Select, SelectItem } from "@heroui/select"

interface AdvancedFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: any) => void
}

export default function AdvancedFilterModal({ isOpen, onClose, onApply }: AdvancedFilterModalProps) {
  const [districts, setDistricts] = useState<any[]>([])
  const [districtId, setDistrictId] = useState<string | null>(null)
  const [organization, setOrganization] = useState<string>("")
  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [phone, setPhone] = useState<string>("")
  const [type, setType] = useState<string>("")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      try {
        const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '')
        const url = base ? `${base}/api/districts?limit=1000` : `/api/districts?limit=1000`
        const res = await fetch(url)
        const text = await res.text()
        const json = text ? JSON.parse(text) : null
        const items = json?.data || []
        setDistricts(items)
      } catch (e) {
        setDistricts([])
      }
    })()
  }, [isOpen])

  const handleApply = () => {
    const filters: any = {}
    if (organization) filters.organization = organization
    if (name) filters.name = name
    if (email) filters.email = email
    if (phone) filters.phone = phone
    if (districtId) filters.districtId = districtId
    if (type) filters.type = type
    if (dateFrom) filters.date_from = dateFrom
    if (dateTo) filters.date_to = dateTo
    onApply(filters)
    onClose()
  }

  const handleClear = () => {
    setOrganization("")
    setName("")
    setEmail("")
    setPhone("")
    setDistrictId(null)
    setType("")
    setDateFrom("")
    setDateTo("")
    // do not auto-apply; caller can choose to clear
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" placement="center">
      <ModalContent className="w-full max-w-[1100px]">
        <ModalHeader className="pb-2">
          <h3 className="text-lg font-semibold">Advanced Filter</h3>
          <p className="text-xs text-default-500">Combine multiple conditions (AND) to refine results</p>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Organization</label>
                <Input className="w-full" value={organization} onChange={(e) => setOrganization((e.target as HTMLInputElement).value)} placeholder="Organization" variant="bordered" classNames={{ inputWrapper: 'h-10 w-full' }} />
              </div>
              <div>
                <label className="text-sm font-medium">Stakeholder Name</label>
                <Input className="w-full" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} placeholder="Full or partial name" variant="bordered" classNames={{ inputWrapper: 'h-10 w-full' }} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input className="w-full" value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} placeholder="Email" variant="bordered" classNames={{ inputWrapper: 'h-10 w-full' }} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input className="w-full" value={phone} onChange={(e) => setPhone((e.target as HTMLInputElement).value)} placeholder="Phone" variant="bordered" classNames={{ inputWrapper: 'h-10 w-full' }} />
              </div>
              <div>
                <label className="text-sm font-medium">Stakeholder Type</label>
                <Input className="w-full" value={type} onChange={(e) => setType((e.target as HTMLInputElement).value)} placeholder="Type" variant="bordered" classNames={{ inputWrapper: 'h-10 w-full' }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">District</label>
                <Select selectedKeys={districtId ? [String(districtId)] : []} onSelectionChange={(keys: any) => setDistrictId(Array.from(keys)[0] as string)} placeholder="Select district" className="w-full" classNames={{ trigger: 'w-full' }}>
                  <SelectItem key="">Any district</SelectItem>
                  {
                    // cast mapped items to any to avoid CollectionElement typing complaints
                    (districts.map((d) => (
                      <SelectItem key={d.District_ID || d.id || d._id}>{d.District_Name || d.District_Number || d.District_ID}</SelectItem>
                    )) as unknown as any)
                  }
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Date Created (from / to)</label>
                <div className="flex gap-2">
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom((e.target as HTMLInputElement).value)} variant="bordered" className="flex-1" classNames={{ inputWrapper: 'h-10 w-full' }} />
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo((e.target as HTMLInputElement).value)} variant="bordered" className="flex-1" classNames={{ inputWrapper: 'h-10 w-full' }} />
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" onPress={() => { handleClear() }}>Clear</Button>
          <Button color="default" onPress={handleApply} className="bg-black text-white">Apply</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
